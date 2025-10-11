"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Table } from "../components/common/Table"
import { Plus, Search } from "lucide-react"
import { mockProjects } from "../services/mockData"
import type { IProject } from "../types"

export const ProjectList: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [projects] = useState<IProject[]>(mockProjects)

  const filteredProjects = projects.filter(
    (project) =>
      project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.responsable.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
    {
      key: "actions",
      header: "Opciones",
      render: (project: IProject) => (
        <div className="table-actions">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/projects/${project.id}`)
            }}
          >
            Ver
          </Button>
        </div>
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
        <Button onClick={() => navigate("/projects/new")}>
          <Plus size={20} />
          Adicionar Proyecto
        </Button>
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

        <Table
          data={filteredProjects}
          columns={columns}
          onRowClick={(project) => navigate(`/projects/${project.id}`)}
        />
      </Card>
    </div>
  )
}
