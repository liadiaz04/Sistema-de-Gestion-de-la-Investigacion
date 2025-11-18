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
import type { IGroup } from "../types"
import { useAuthStore } from "../stores/authStore"
import type { Group } from "../types/api/group"
import "./GroupList.css"

// Función para mapear Group (API) a IGroup (Frontend)
const mapGroupToIGroup = (group: Group): IGroup => {
  // Parsear subjects (temáticas) - pueden venir como string separado por comas
  const tematicas = group.subjects 
    ? group.subjects.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : []

  // Parsear nombre del líder
  const leaderName = group.leader?.name || ''
  const nameParts = leaderName.split(' ')
  const nombre = nameParts[0] || ''
  const apellidos = nameParts.slice(1).join(' ') || ''

  return {
    id: group.id_group.toString(),
    nombre: group.name,
    descripcion: group.problems || '',
    responsable: group.leader ? {
      id: group.leader.id_integrant.toString(),
      nombre,
      apellidos,
      numeroIdentidad: '',
      correoElectronico: group.leader.email || '',
      nombreUsuario: '',
      roles: [],
      esExterno: false,
      esAdministrador: false,
    } : undefined,
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
  const { user } = useAuthStore()
  const isAdmin = user?.roles?.includes('admin') || false
  const isResponsableGrupo = user?.roles?.includes('responsable_grupo') || false
  
  const [searchTerm, setSearchTerm] = useState("")
  const [groups, setGroups] = useState<IGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewFilter, setViewFilter] = useState<"todos" | "mis_grupos">("todos")
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; groupId: string | null }>({
    show: false,
    groupId: null,
  })

  const userId = user?.id ? parseInt(user.id) : null

  // Cargar grupos al montar el componente o cambiar el filtro
  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true)
      setError(null)
      try {
        const filters: any = {
          limit: 100,
        }
        
        // Si hay término de búsqueda, agregarlo
        if (searchTerm.trim()) {
          filters.search = searchTerm.trim()
        }
        
        const fetchedGroups = await groupService.getAllGroups(filters)
        const mappedGroups = fetchedGroups.map(mapGroupToIGroup)
        
        // Filtrar por "mis grupos" si es necesario (filtrado local ya que el backend no tiene ese filtro)
        let filtered = mappedGroups
        if (isResponsableGrupo && viewFilter === "mis_grupos" && userId) {
          filtered = mappedGroups.filter(g => 
            g.responsable && parseInt(g.responsable.id) === userId
          )
        }
        
        setGroups(filtered)
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
  }, [viewFilter, userId, searchTerm, isResponsableGrupo])

  const filteredGroups = groups.filter((group) => {
    // La búsqueda ya se hace en el backend, pero podemos filtrar localmente también
    const matchesSearch =
      group.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.responsable?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    if (isResponsableGrupo && viewFilter === "mis_grupos") {
      return matchesSearch && group.responsable && parseInt(group.responsable.id) === userId
    }
    
    return matchesSearch
  })

  const canEditGroup = (group: IGroup) => {
    if (isAdmin) return true
    if (isResponsableGrupo && group.responsable && parseInt(group.responsable.id) === userId) return true
    return false
  }

  const handleDelete = async (groupId: string) => {
    try {
      await groupService.deleteGroup(parseInt(groupId))
      // Recargar la lista después de eliminar
      const filters: any = {
        limit: 100,
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }
      const fetchedGroups = await groupService.getAllGroups(filters)
      const mappedGroups = fetchedGroups.map(mapGroupToIGroup)
      
      // Aplicar filtro de "mis grupos" si es necesario
      let filtered = mappedGroups
      if (isResponsableGrupo && viewFilter === "mis_grupos" && userId) {
        filtered = mappedGroups.filter(g => 
          g.responsable && parseInt(g.responsable.id) === userId
        )
      }
      
      setGroups(filtered)
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
          <p>Gestión de grupos de investigación (Quorum)</p>
        </div>
        {isAdmin && (
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
          {isResponsableGrupo && (
            <div className="filter-group">
              <label>Filtrar:</label>
              <select
                value={viewFilter}
                onChange={(e) => setViewFilter(e.target.value as "todos" | "mis_grupos")}
                className="form-select"
              >
                <option value="todos">Todos los grupos</option>
                <option value="mis_grupos">Mis grupos</option>
              </select>
            </div>
          )}
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
