"use client"

import { useState, useEffect } from "react"
import type { IUser, UserRole } from "../types"
import { userService } from "../services/userService"
import { useAuthStore } from "../stores/authStore"
import { Button } from "../components/common/Button"
import { Card } from "../components/common/Card"
import { ConfirmDialog } from "../components/common/ConfirmDialog"
import "./UserManagement.css"

export const UserManagement = () => {
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [newRole, setNewRole] = useState<UserRole>("usuario")
  const [showAddConfirm, setShowAddConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [roleToRemove, setRoleToRemove] = useState<{ userId: string; role: UserRole } | null>(null)
  const currentUser = useAuthStore((state) => state.user)

  const roles: UserRole[] = [
    "admin",
    "responsable_proyecto",
    "responsable_grupo",
    "integrante_proyecto",
    "integrante_grupo",
    "consejo_cientifico",
    "autor_registro",
    "usuario",
  ]

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRole = async (userId: string) => {
    if (!currentUser) return
    try {
      await userService.updateUserRole(userId, newRole, currentUser)
      await loadUsers()
      setSelectedUser(null)
      setShowAddConfirm(false)
    } catch (error) {
      console.error("Error adding role:", error)
    }
  }

  const handleRemoveRole = async (userId: string, role: UserRole) => {
    if (!currentUser) return
    try {
      await userService.removeUserRole(userId, role, currentUser)
      await loadUsers()
      setShowRemoveConfirm(false)
      setRoleToRemove(null)
    } catch (error) {
      console.error("Error removing role:", error)
    }
  }

  const initiateRemoveRole = (userId: string, role: UserRole) => {
    setRoleToRemove({ userId, role })
    setShowRemoveConfirm(true)
  }

  const initiateAddRole = () => {
    setShowAddConfirm(true)
  }

  if (loading) return <div className="loading">Cargando usuarios...</div>

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <p>Administrar usuarios y sus roles en el sistema</p>
      </div>

      <Card>
        <div className="table-container">
          <table className="data-table user-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Usuario</th>
                <th>Correo Electrónico</th>
                <th>Tipo</th>
                <th>Roles Asignados</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="name-cell">
                    {user.nombre} {user.apellidos}
                  </td>
                  <td className="username-cell">{user.nombreUsuario}</td>
                  <td className="email-cell">{user.correoElectronico}</td>
                  <td className="type-cell">
                    <span className={`type-badge ${user.esExterno ? "external" : "internal"}`}>
                      {user.esExterno ? "Externo" : "Interno"}
                    </span>
                  </td>
                  <td className="roles-cell">
                    <div className="roles-list">
                      {user.roles.map((role) => (
                        <span key={role} className="role-badge">
                          {role}
                          {currentUser?.roles.includes("admin") && (
                            <button
                              className="remove-role-btn"
                              onClick={() => initiateRemoveRole(user.id, role)}
                              title="Eliminar rol"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="actions-cell">
                    {currentUser?.roles.includes("admin") && (
                      <Button variant="secondary" size="sm" onClick={() => setSelectedUser(user)}>
                        Agregar Rol
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              Agregar Rol a {selectedUser.nombre} {selectedUser.apellidos}
            </h2>
            <div className="form-group">
              <label>Seleccionar Rol</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="form-select">
                {roles.map((role) => (
                  <option key={role} value={role} disabled={selectedUser.roles.includes(role)}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                Cancelar
              </Button>
              <Button onClick={initiateAddRole}>Agregar Rol</Button>
            </div>
          </div>
        </div>
      )}

      {showAddConfirm && selectedUser && (
        <ConfirmDialog
          title="Confirmar Agregar Rol"
          message={`¿Está seguro que desea agregar el rol "${newRole}" al usuario ${selectedUser.nombre} ${selectedUser.apellidos}?`}
          onConfirm={() => handleAddRole(selectedUser.id)}
          onCancel={() => setShowAddConfirm(false)}
        />
      )}

      {showRemoveConfirm && roleToRemove && (
        <ConfirmDialog
          title="Confirmar Eliminar Rol"
          message={`¿Está seguro que desea eliminar el rol "${roleToRemove.role}" de este usuario?`}
          onConfirm={() => handleRemoveRole(roleToRemove.userId, roleToRemove.role)}
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
