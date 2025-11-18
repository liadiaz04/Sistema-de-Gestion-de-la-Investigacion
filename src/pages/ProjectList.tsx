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
import { projectService } from "../services/projectService"
import { useAuthStore } from "../stores/authStore"
import type { IProject } from "../types"
import type { Project } from "../types/api/project"

// Función para mapear Project (API) a IProject (Frontend)
const mapProjectToIProject = (project: Project): IProject => {
  return {
    id: project.id_project.toString(),
    nombre: project.title,
    descripcion: project.description || '',
    responsable: project.responsible ? {
      id: project.responsible.id_integrant.toString(),
      nombre: project.responsible.name.split(' ')[0] || project.responsible.name,
      apellidos: project.responsible.name.split(' ').slice(1).join(' ') || '',
      numeroIdentidad: '',
      correoElectronico: project.responsible.email || '',
      nombreUsuario: '',
      roles: [],
      esExterno: false,
      esAdministrador: false,
    } : undefined,
    tematica: project.classification?.name || '',
    programa: project.type?.name || '',
    tipoProyecto: project.type?.name,
    esPriorizado: project.is_prioritized,
    estaAprobado: project.is_approved,
    estado: mapStateToFrontend(project.state?.name || 'propuesta'),
    fechaInicio: project.start_date,
    fechaFin: project.end_date || undefined,
    objetivos: project.objectives || undefined,
    tareas: project.tasks || undefined,
    detallesCientificos: project.scientific_details || undefined,
    otrosDatos: project.other_data || undefined,
    criterioConsejo: project.council_criteria || undefined,
  }
}

// Función para mapear el estado del backend al formato del frontend
const mapStateToFrontend = (state: string): "propuesta" | "activo" | "finalizado" | "cancelado" => {
  const stateMap: Record<string, "propuesta" | "activo" | "finalizado" | "cancelado"> = {
    'propuesta': 'propuesta',
    'activo': 'activo',
    'en_progreso': 'activo',
    'finalizado': 'finalizado',
    'cancelado': 'cancelado',
  }
  return stateMap[state.toLowerCase()] || 'propuesta'
}

const ProjectList: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [projects, setProjects] = useState<IProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewFilter, setViewFilter] = useState<"todos" | "mis_proyectos">("todos")
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; projectId: string | null }>({
    show: false,
    projectId: null,
  })
  
  const isAdmin = user?.roles?.includes('admin') || false
  const isResponsableProyecto = user?.roles?.includes('responsable_proyecto') || false
  const userId = user?.id ? parseInt(user.id) : null

  // Cargar proyectos al montar el componente o cambiar el filtro
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true)
      setError(null)
      try {
        const filters: any = {
          limit: 100,
        }
        
        // Si el filtro es "mis_proyectos" y hay userId, filtrar por responsable
        if (viewFilter === "mis_proyectos" && userId) {
          filters.responsible_id = userId
        }
        
        // Si hay término de búsqueda, agregarlo
        if (searchTerm.trim()) {
          filters.search = searchTerm.trim()
        }
        
        const fetchedProjects = await projectService.getAllProjects(filters)
        const mappedProjects = fetchedProjects.map(mapProjectToIProject)
        setProjects(mappedProjects)
      } catch (err) {
        console.error("Error cargando proyectos:", err)
        setError(err instanceof Error ? err.message : "Error al cargar los proyectos")
      } finally {
        setLoading(false)
      }
    }

    // Debounce para la búsqueda
    const timeoutId = setTimeout(() => {
      loadProjects()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [viewFilter, userId, searchTerm])

  const filteredProjects = projects.filter((project) => {
    // La búsqueda ya se hace en el backend, pero podemos filtrar localmente también
    const matchesSearch =
      project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.responsable && project.responsable.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    
    if (isResponsableProyecto && viewFilter === "mis_proyectos") {
      return matchesSearch && project.responsable?.id === user?.id
    }
    
    return matchesSearch
  })

  const canEditProject = (project: IProject) => {
    if (isAdmin) return true
    if (isResponsableProyecto && project.responsable?.id === user?.id) return true
    return false
  }

  const handleDelete = async (projectId: string) => {
    try {
      await projectService.deleteProject(parseInt(projectId))
      // Recargar la lista después de eliminar
      const filters: any = {
        limit: 100,
      }
      if (viewFilter === "mis_proyectos" && userId) {
        filters.responsible_id = userId
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }
      const fetchedProjects = await projectService.getAllProjects(filters)
      const mappedProjects = fetchedProjects.map(mapProjectToIProject)
      setProjects(mappedProjects)
      setDeleteConfirm({ show: false, projectId: null })
    } catch (err) {
      console.error("Error eliminando proyecto:", err)
      setError(err instanceof Error ? err.message : "Error al eliminar el proyecto")
    }
  }

  const columns = [
    { key: "nombre", header: "Nombre" },
    {
      key: "responsable",
      header: "Responsable",
      render: (project: IProject) => 
        project.responsable 
          ? `${project.responsable.nombre} ${project.responsable.apellidos}`
          : 'Sin responsable',
    },
    { key: "tematica", header: "Temática" },
    { key: "programa", header: "Programa" },
    {
      key: "estado",
      header: "Estado",
      render: (project: IProject) => (
        <span className={`badge badge-${project.estado}`}>{project.estado}</span>
      ),
    },
    {
      key: "actions",
      header: "Opciones",
      render: (project: IProject) => (
        canEditProject(project) ? (
          <OptionsMenu
            onView={() => navigate(`/projects/${project.id}`)}
            onEdit={() => navigate(`/projects/${project.id}/edit`)}
            onDelete={() => setDeleteConfirm({ show: true, projectId: project.id })}
          />
        ) : (
          <Button variant="outline" onClick={() => navigate(`/projects/${project.id}`)}>
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
          <h1>Proyectos de Investigación</h1>
          <p>Gestión de proyectos de investigación (Copérnico)</p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate("/projects/new")}>
            <Plus size={20} />
            Adicionar Proyecto
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
          {isResponsableProyecto && (
            <div className="filter-group">
              <label>Filtrar:</label>
              <select
                value={viewFilter}
                onChange={(e) => setViewFilter(e.target.value as "todos" | "mis_proyectos")}
                className="form-select"
              >
                <option value="todos">Todos los proyectos</option>
                <option value="mis_proyectos">Mis proyectos</option>
              </select>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 className="animate-spin" size={32} />
            <span style={{ marginLeft: '1rem' }}>Cargando proyectos...</span>
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
            {filteredProjects.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No se encontraron proyectos</p>
              </div>
            ) : (
              <Table data={filteredProjects} columns={columns} />
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Eliminar Proyecto"
        message="¿Está seguro que desea eliminar este proyecto de investigación? Esta acción no se puede deshacer."
        onConfirm={() => deleteConfirm.projectId && handleDelete(deleteConfirm.projectId)}
        onCancel={() => setDeleteConfirm({ show: false, projectId: null })}
      />
    </div>
  )
}

export { ProjectList }
export default ProjectList
