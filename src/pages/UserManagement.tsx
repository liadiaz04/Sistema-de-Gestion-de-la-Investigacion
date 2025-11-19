"use client"

import { useState, useEffect } from "react"
import type { IUser, UserRole } from "../types"
import { userService } from "../services/userService"
import { roleService } from "../services/roleService"
import { useAuthStore } from "../stores/authStore"
import { usePermissions } from "../hooks/usePermissions"
import { Button } from "../components/common/Button"
import { Card } from "../components/common/Card"
import { ConfirmDialog } from "../components/common/ConfirmDialog"
import { OptionsMenu } from "../components/common/OptionsMenu"
import { Loader2, AlertCircle } from "lucide-react"
import type { Role } from "../types/api/role"
import "./UserManagement.css"

// Mapeo de role_name del backend a UserRole del frontend
// Backend roles: ADMIN (id:1), USUARIO (id:2), CONSEJO (id:3), AUTOR (id:4)
const mapRoleNameToUserRole = (role: { id_role: number; role_name: string }): UserRole => {
  const roleName = role.role_name.toUpperCase();
  
  // Mapear según los IDs primero (más confiable)
  if (role.id_role === 1 || roleName === 'ADMIN') return 'admin';
  if (role.id_role === 2 || roleName === 'USUARIO') return 'integrant';
  if (role.id_role === 3 || roleName === 'CONSEJO') return 'consejo';
  if (role.id_role === 4 || roleName === 'AUTOR') return 'autor_registro';
  
  // Mapeo por nombre para roles adicionales
  const roleMap: Record<string, UserRole> = {
    'responsable_proyecto': 'responsable_proyecto',
    'responsable_grupo': 'responsable_grupo',
    'integrante_proyecto': 'integrante_proyecto',
    'integrante_grupo': 'integrante_grupo',
    'consejo_cientifico': 'consejo',
    'autor_registro': 'autor_registro',
    'usuario': 'usuario',
  }
  
  return roleMap[role.role_name.toLowerCase()] || 'usuario'
}

// Mapeo de UserRole a etiqueta legible
const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  integrant: "Integrante",
  consejo: "Consejo Científico",
  responsable_proyecto: "Responsable de Proyecto",
  responsable_grupo: "Responsable de Grupo",
  integrante_proyecto: "Integrante de Proyecto",
  integrante_grupo: "Integrante de Grupo",
  consejo_cientifico: "Consejo Científico",
  autor_registro: "Autor de Registro",
  usuario: "Usuario",
}

export const UserManagement = () => {
  const { isAdmin } = usePermissions()
  const [users, setUsers] = useState<IUser[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [newRole, setNewRole] = useState<UserRole>("usuario")
  const [showViewRolesModal, setShowViewRolesModal] = useState(false)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [showRemoveRoleModal, setShowRemoveRoleModal] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [roleToRemove, setRoleToRemove] = useState<{ userId: string; role: UserRole } | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const currentUser = useAuthStore((state) => state.user)

  // Convertir roles del backend a UserRole[] (eliminar duplicados)
  const roles: UserRole[] = Array.from(
    new Set(availableRoles.map(r => mapRoleNameToUserRole(r)))
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar usuarios y roles en paralelo
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(),
        roleService.getAllRoles({ limit: 100 }),
      ])
      setUsers(usersData)
      setAvailableRoles(rolesData)
      
      if (selectedUser) {
        const updatedUser = usersData.find((u) => u.id === selectedUser.id)
        if (updatedUser) {
          setSelectedUser(updatedUser)
        }
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers()
      setUsers(data)
      if (selectedUser) {
        const updatedUser = data.find((u) => u.id === selectedUser.id)
        if (updatedUser) {
          setSelectedUser(updatedUser)
        }
      }
    } catch (error) {
      console.error("Error loading users:", error)
      showNotification("Error al cargar los usuarios", "error")
    }
  }

  const handleModifyRole = async () => {
    if (!currentUser || !selectedUser) return
    try {
      await userService.modifyUserRole(selectedUser.id, newRole, currentUser)
      await loadUsers()
      setSelectedUser(null)
      setShowAddRoleModal(false)
      setNewRole("usuario")
      showNotification("Rol modificado exitosamente", "success")
    } catch (error) {
      console.error("Error modifying role:", error)
      showNotification("Error al modificar el rol", "error")
    }
  }

  const handleRemoveRole = async () => {
    if (!currentUser || !roleToRemove) return
    try {
      const updatedUser = await userService.removeUserRole(roleToRemove.userId, roleToRemove.role, currentUser)
      await loadUsers()
      setShowRemoveConfirm(false)
      setRoleToRemove(null)

      if (selectedUser && selectedUser.id === updatedUser.id) {
        setSelectedUser(updatedUser)
      }

      showNotification("Rol eliminado exitosamente", "success")
    } catch (error) {
      console.error("Error removing role:", error)
      showNotification("Error al eliminar el rol", "error")
    }
  }

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const initiateViewRoles = (user: IUser) => {
    setSelectedUser(user)
    setShowViewRolesModal(true)
  }

  const initiateModifyRole = (user: IUser) => {
    setSelectedUser(user)
    setShowAddRoleModal(true)
  }

  const initiateRemoveRoleModal = (user: IUser) => {
    setSelectedUser(user)
    setShowRemoveRoleModal(true)
  }

  const initiateRemoveRole = (userId: string, role: UserRole) => {
    if (role === "admin" || role === "usuario") {
      showNotification(`El rol "${roleLabels[role]}" no puede ser eliminado`, "error")
      return
    }
    setRoleToRemove({ userId, role })
    setShowRemoveConfirm(true)
  }

  const getInitials = (nombre: string, apellidos: string) => {
    return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase()
  }

  const getPrimaryRole = (roles: UserRole[]): UserRole => {
    const rolePriority: UserRole[] = [
      "admin",
      "consejo",
      "responsable_grupo",
      "responsable_proyecto",
      "consejo_cientifico",
      "autor_registro",
      "integrante_grupo",
      "integrante_proyecto",
      "integrant",
      "usuario",
    ]

    for (const role of rolePriority) {
      if (roles.includes(role)) {
        return role
      }
    }
    return "usuario"
  }

  const filteredUsers = users.filter(
    (user) =>
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correoElectronico.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="user-management">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader2 className="animate-spin" size={32} />
          <span style={{ marginLeft: '1rem' }}>Cargando usuarios...</span>
        </div>
      </div>
    )
  }

  // Verificar permisos
  if (!isAdmin()) {
    return (
      <div className="user-management">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', color: '#c33' }} />
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-management">
      {notification && <div className={`notification notification-${notification.type}`}>{notification.message}</div>}
      {error && (
        <div style={{ 
          padding: '1rem', 
          margin: '1rem', 
          backgroundColor: '#fee', 
          color: '#c33',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="page-header">
        <div className="header-content">
          <h1>Usuarios</h1>
          <p className="subtitle">Gestiona los usuarios del sistema</p>
        </div>
      </div>

      <Card>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </Card>

      <Card>
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="user-info-cell">
                    <div className="user-info">
                      <div className="user-avatar">{getInitials(user.nombre, user.apellidos)}</div>
                      <div className="user-details">
                        <div className="user-name">
                          {user.nombre} {user.apellidos}
                        </div>
                        <div className="user-email">{user.correoElectronico}</div>
                      </div>
                    </div>
                  </td>
                  <td className="role-cell">
                    <span className="role-tag">
                      {roleLabels[getPrimaryRole(user.roles)] || getPrimaryRole(user.roles)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {isAdmin() && (
                      <OptionsMenu
                        options={[
                          {
                            label: "Ver roles actuales",
                            onClick: () => initiateViewRoles(user),
                          },
                          {
                            label: "Modificar rol",
                            onClick: () => initiateModifyRole(user),
                          },
                          {
                            label: "Eliminar rol",
                            onClick: () => initiateRemoveRoleModal(user),
                          },
                        ]}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showViewRolesModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowViewRolesModal(false)}>
          <div className="modal-content-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Roles Actuales</h2>
              <button className="modal-close" onClick={() => setShowViewRolesModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="user-info-text">
                <strong>
                  {selectedUser.nombre} {selectedUser.apellidos}
                </strong>
              </p>
              <p className="user-email-text">{selectedUser.correoElectronico}</p>

              <div className="roles-display">
                {selectedUser.roles.length > 0 ? (
                  selectedUser.roles.map((role) => (
                    <div key={role} className="role-badge">
                      {roleLabels[role] || role}
                    </div>
                  ))
                ) : (
                  <p className="helper-text">El usuario no tiene roles asignados</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowViewRolesModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowAddRoleModal(false)}>
          <div className="modal-content-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modificar Rol</h2>
              <button className="modal-close" onClick={() => setShowAddRoleModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="user-info-text">
                <strong>
                  {selectedUser.nombre} {selectedUser.apellidos}
                </strong>
              </p>
              <p className="helper-text" style={{ marginTop: '0.5rem', marginBottom: '1rem', color: '#666' }}>
                El rol seleccionado reemplazará todos los roles actuales del usuario.
              </p>

              <div className="form-group">
                <label>Seleccionar Nuevo Rol</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="form-select"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role] || role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowAddRoleModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleModifyRole}>Modificar</Button>
            </div>
          </div>
        </div>
      )}

      {showRemoveRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRemoveRoleModal(false)}>
          <div className="modal-content-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Rol</h2>
              <button className="modal-close" onClick={() => setShowRemoveRoleModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="user-info-text">
                <strong>
                  {selectedUser.nombre} {selectedUser.apellidos}
                </strong>
              </p>

              <div className="roles-display">
                <p className="helper-text">Seleccione el rol que desea eliminar:</p>
                {selectedUser.roles.map((role) => (
                  <button
                    key={role}
                    className="role-badge-clickable"
                    onClick={() => {
                      setShowRemoveRoleModal(false)
                      initiateRemoveRole(selectedUser.id, role)
                    }}
                  >
                    {roleLabels[role] || role}
                    <span className="remove-icon">×</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowRemoveRoleModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRemoveConfirm && roleToRemove && (
        <ConfirmDialog
          isOpen={showRemoveConfirm}
          title="Confirmar Eliminación"
          message={`¿Está seguro que desea eliminar el rol "${roleLabels[roleToRemove.role]}" de este usuario?`}
          onConfirm={handleRemoveRole}
          onCancel={() => {
            setShowRemoveConfirm(false)
            setRoleToRemove(null)
          }}
          confirmText="Eliminar"
          confirmVariant="danger"
        />
      )}
    </div>
  )
}

export default UserManagement
