"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Table } from "../components/common/Table"
import { OptionsMenu } from "../components/common/OptionsMenu"
import { ConfirmDialog } from "../components/common/ConfirmDialog"
import { Plus, Search } from 'lucide-react'
import { mockProjects } from "../services/mockData"
import { useAuthStore } from "../stores/authStore"
import type { IProject } from "../types"

const ProjectList: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [projects, setProjects] = useState<IProject[]>(mockProjects)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; projectId: string | null }>({
    show: false,
    projectId: null,
  })
  const { user } = useAuthStore()
  const isAdmin =  false


  const filteredProjects = projects.filter(
    (project) =>
      project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.responsable.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = (projectId: string) => {
    setProjects(projects.filter((p) => p.id !== projectId))
    setDeleteConfirm({ show: false, projectId: null })
  }

  const columns = [
    { key: "nombre", header: "Nombre" },
    {
      key: "responsable",
      header: "Responsable",
      render: (project: IProject) => `${project.responsable.nombre} ${project.responsable.apellidos}`,
    },
    { key: "tematica", header: "Temática" },
    { key: "programa", header: "Programa" },
    {
      key: "esPriorizado",
      header: "Priorizado",
      render: (project: IProject) => (
        <span className={project.esPriorizado ? "badge badge-success" : "badge badge-secondary"}>
          {project.esPriorizado ? "Sí" : "No"}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (project: IProject) => <span className={`badge badge-${project.estado}`}>{project.estado}</span>,
    },
    ...(isAdmin ? [{
      key: "actions",
      header: "Opciones",
      render: (project: IProject) => (
        <OptionsMenu
          onView={() => navigate(`/projects/${project.id}`)}
          onEdit={() => navigate(`/projects/${project.id}/edit`)}
          onDelete={() => setDeleteConfirm({ show: true, projectId: project.id })}
        />
      ),
    }] : [{
      key: "actions",
      header: "Opciones",
      render: (project: IProject) => (
        <Button variant="outline" onClick={() => navigate(`/projects/${project.id}`)}>
          Ver detalles
        </Button>
      ),
    }]),
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
        </div>

        <Table data={filteredProjects} columns={columns} />
      </Card>

      {isAdmin && (
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          title="Eliminar Proyecto"
          message="¿Está seguro que desea eliminar este proyecto de investigación? Esta acción no se puede deshacer."
          onConfirm={() => deleteConfirm.projectId && handleDelete(deleteConfirm.projectId)}
          onCancel={() => setDeleteConfirm({ show: false, projectId: null })}
        />
      )}
    </div>
  )
}

export { ProjectList }
export default ProjectList
