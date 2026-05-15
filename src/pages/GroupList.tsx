"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Table } from "../components/common/Table"
import { OptionsMenu } from "../components/common/OptionsMenu"
import { ConfirmDialog } from "../components/common/ConfirmDialog"
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react'
import { groupService } from "../services/groupService"
import { integrantService } from "../services/integrantService"
import type { IGroup, IUser } from "../types"
import { usePermissions } from "../hooks/usePermissions"
import type { Group } from "../types/api/group"
import type { IntegrantWithRoles } from "../types/api/integrant"
import "./GroupList.css"

// Función para mapear IntegrantWithRoles a IUser
const mapIntegrantToIUser = (integrant: IntegrantWithRoles): IUser => {
  const nameParts = integrant.name.split(' ')
  const nombre = nameParts[0] || ''
  const apellidos = nameParts.slice(1).join(' ') || ''

  return {
    id: integrant.id_integrant.toString(),
    nombre,
    apellidos,
    numeroIdentidad: integrant.identity || '',
    correoElectronico: integrant.email || '',
    nombreUsuario: integrant.email?.split('@')[0] || '',
    roles: integrant.roles?.map(r => {
      const roleName = r.role_name.toUpperCase()
      if (roleName === 'ADMIN' || r.id_role === 1) return 'admin'
      if (roleName === 'INTEGRANT' || r.id_role === 2) return 'integrant'
      if (roleName === 'CONSEJO' || r.id_role === 3) return 'consejo'
      return 'usuario'
    }) || [],
    esExterno: integrant.external,
    esAdministrador: integrant.roles?.some(r => r.id_role === 1) || false,
  }
}

// Función para mapear Group (API) a IGroup (Frontend)
const mapGroupToIGroup = (group: Group): IGroup => {
  // Parsear subjects (temáticas) - pueden venir como string separado por comas
  const tematicas = group.subjects 
    ? group.subjects.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : []

  // Obtener el responsable: primero intentar desde leader, luego desde members usando id_admin
  let responsable: IUser | undefined = undefined
  
  if (group.leader) {
    // Si viene el objeto leader completo
    const leaderName = group.leader.name || ''
    const nameParts = leaderName.split(' ')
    const nombre = nameParts[0] || ''
    const apellidos = nameParts.slice(1).join(' ') || ''
    
    responsable = {
      id: group.leader.id_integrant.toString(),
      nombre,
      apellidos,
      numeroIdentidad: '',
      correoElectronico: group.leader.email || '',
      nombreUsuario: '',
      roles: [],
      esExterno: false,
      esAdministrador: false,
    }
  } else if (group.id_admin && group.members) {
    // Buscar el responsable en los miembros usando id_admin
    const responsableMember = group.members.find(m => m.id_integrant === group.id_admin)
    if (responsableMember) {
      const nameParts = responsableMember.name.split(' ')
      const nombre = nameParts[0] || ''
      const apellidos = nameParts.slice(1).join(' ') || ''
      
      responsable = {
        id: responsableMember.id_integrant.toString(),
        nombre,
        apellidos,
        numeroIdentidad: '',
        correoElectronico: '',
        nombreUsuario: '',
        roles: [],
        esExterno: false,
        esAdministrador: false,
      }
    } else if (group.id_admin) {
      // Si no está en members pero tenemos id_admin, crear un objeto básico
      responsable = {
        id: group.id_admin.toString(),
        nombre: '',
        apellidos: '',
        numeroIdentidad: '',
        correoElectronico: '',
        nombreUsuario: '',
        roles: [],
        esExterno: false,
        esAdministrador: false,
      }
    }
  } else if (group.id_integrant) {
    // Fallback a id_integrant si existe (legacy)
    responsable = {
      id: group.id_integrant.toString(),
      nombre: '',
      apellidos: '',
      numeroIdentidad: '',
      correoElectronico: '',
      nombreUsuario: '',
      roles: [],
      esExterno: false,
      esAdministrador: false,
    }
  }

  return {
    id: group.id_group.toString(),
    nombre: group.name,
    descripcion: group.problems || '',
    responsable,
    tematicas,
    facultad: group.faculty?.name || '',
    area: group.faculty_area?.name || undefined,
    departamento: undefined, // No hay campo departamento en el modelo, solo faculty_area
    fechaCreacion: group.create_date,
    fechaActualizacion: group.update_date,
    totalIntegrantes: group.members?.length || 0,
  }
}

export const GroupList: React.FC = () => {
  const navigate = useNavigate()
  const { canCreateGroups, canManageAllGroups } = usePermissions()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [groups, setGroups] = useState<IGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOnlyMyGroups, setShowOnlyMyGroups] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; groupId: string | null }>({
    show: false,
    groupId: null,
  })

  // Obtener user_id del localStorage
  const userId = localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')!) : null

  // Cargar grupos al montar el componente o cambiar el filtro
  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true)
      setError(null)
      try {
        const filters: any = {
          limit: 100,
        }
        
        // Si el checkbox está marcado y hay userId, filtrar por id_admin
        if (showOnlyMyGroups && userId) {
          filters.id_admin = userId
        }
        
        // Si hay término de búsqueda, agregarlo
        if (searchTerm.trim()) {
          filters.search = searchTerm.trim()
        }
        
        const fetchedGroups = await groupService.getAllGroups(filters)
        
        // Identificar IDs de responsables que necesitan ser cargados desde el endpoint
        // Cargamos todos los responsables que no vienen con el objeto leader completo
        const responsableIdsToLoad = new Set<number>()
        fetchedGroups.forEach(group => {
          // Si no viene leader pero sí id_admin, necesitamos cargarlo
          if (!group.leader && group.id_admin) {
            responsableIdsToLoad.add(group.id_admin)
          }
          // Si viene id_integrant pero no leader, también cargarlo
          else if (!group.leader && group.id_integrant) {
            responsableIdsToLoad.add(group.id_integrant)
          }
        })
        
        // Cargar los detalles de los responsables en paralelo
        const responsablesMap = new Map<number, IUser>()
        if (responsableIdsToLoad.size > 0) {
          const responsablePromises = Array.from(responsableIdsToLoad).map(id => 
            integrantService.getIntegrantById(id).catch(err => {
              console.warn(`Error cargando integrante ${id}:`, err)
              return null
            })
          )
          
          const responsables = await Promise.all(responsablePromises)
          
          responsables.forEach(integrant => {
            if (integrant) {
              const iUser = mapIntegrantToIUser(integrant)
              responsablesMap.set(integrant.id_integrant, iUser)
            }
          })
        }
        
        // Mapear grupos y usar los responsables cargados cuando sea necesario
        const mappedGroups = fetchedGroups.map(group => {
          const mapped = mapGroupToIGroup(group)
          
          // Si el responsable no tiene nombre completo, intentar obtenerlo del mapa
          if (mapped.responsable && (!mapped.responsable.nombre || mapped.responsable.nombre.trim() === '')) {
            const responsableId = parseInt(mapped.responsable.id)
            if (!isNaN(responsableId)) {
              const responsableCompleto = responsablesMap.get(responsableId)
              if (responsableCompleto) {
                return {
                  ...mapped,
                  responsable: responsableCompleto
                }
              }
            }
          }
          
          return mapped
        })
        
        setGroups(mappedGroups)
      } catch (err) {
        console.error("Error cargando grupos:", err)
        setError(err instanceof Error ? err.message : "Error al cargar los grupos")
      } finally {
        setLoading(false)
      }
    }

    // Debounce para la búsqueda
    const timeoutId = setTimeout(() => {
      loadGroups()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [showOnlyMyGroups, userId, searchTerm])

  const filteredGroups = groups.filter((group) => {
    // La búsqueda ya se hace en el backend, pero podemos filtrar localmente también
    const matchesSearch =
      group.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.responsable?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    return matchesSearch
  })

  const isUserResponsible = (group: IGroup) => {
    if (!userId) return false
    return group.responsable && parseInt(group.responsable.id) === userId
  }

  const canEditGroup = (group: IGroup) => {
    if (canManageAllGroups()) return true
    if (isUserResponsible(group)) return true
    return false
  }

  const handleDelete = async (groupId: string) => {
    try {
      await groupService.deleteGroup(parseInt(groupId))
      // Recargar la lista después de eliminar
      const filters: any = {
        limit: 100,
      }
      if (showOnlyMyGroups && userId) {
        filters.id_admin = userId
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }
      const fetchedGroups = await groupService.getAllGroups(filters)
      const mappedGroups = fetchedGroups.map(mapGroupToIGroup)
      setGroups(mappedGroups)
      setDeleteConfirm({ show: false, groupId: null })
    } catch (err) {
      console.error("Error eliminando grupo:", err)
      setError(err instanceof Error ? err.message : "Error al eliminar el grupo")
    }
  }

  const columns = [
    { key: "nombre", header: "Nombre" },
    {
      key: "responsable",
      header: "Responsable",
      render: (group: IGroup) => group.responsable ? `${group.responsable.nombre} ${group.responsable.apellidos}` : "No asignado",
    },
    {
      key: "tematicas",
      header: "Temáticas",
      render: (group: IGroup) => group.tematicas.length > 0 ? group.tematicas.join(", ") : "Sin temáticas",
    },
    { key: "facultad", header: "Facultad" },
    { key: "totalIntegrantes", header: "Integrantes" },
    {
      key: "actions",
      header: "Opciones",
      render: (group: IGroup) => (
        canEditGroup(group) ? (
          <OptionsMenu
            onView={() => navigate(`/groups/${group.id}`)}
            onEdit={() => navigate(`/groups/${group.id}/edit`)}
            onDelete={() => setDeleteConfirm({ show: true, groupId: group.id })}
          />
        ) : (
          <Button variant="outline" onClick={() => navigate(`/groups/${group.id}`)}>
            Ver detalles
          </Button>
        )
      ),
    },
  ]

  return (
    <div className="group-list">
      <div className="group-list-header">
        <div>
          <h1>Grupos de Investigación</h1>
          <p>Gestión de grupos de investigación</p>
        </div>
        {canCreateGroups() && (
          <Button onClick={() => navigate("/groups/new")}>
            <Plus size={20} />
            Adicionar Grupo
          </Button>
        )}
      </div>

      <Card>
        <div className="group-list-filters">
          <div className="group-list-search">
            <Search size={20} />
            <Input
              type="text"
              placeholder="Buscar por nombre, responsable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showOnlyMyGroups}
                onChange={(e) => setShowOnlyMyGroups(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Mis grupos</span>
            </label>
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 className="animate-spin" size={32} />
            <span style={{ marginLeft: '1rem' }}>Cargando grupos...</span>
          </div>
        )}

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

        {!loading && !error && (
          <>
            {filteredGroups.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No se encontraron grupos</p>
              </div>
            ) : (
              <Table data={filteredGroups} columns={columns} />
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Eliminar Grupo"
        message="¿Está seguro que desea eliminar este grupo de investigación? Esta acción no se puede deshacer."
        onConfirm={() => deleteConfirm.groupId && handleDelete(deleteConfirm.groupId)}
        onCancel={() => setDeleteConfirm({ show: false, groupId: null })}
      />
    </div>
  )
}
