"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Table } from "../components/common/Table"
import { Plus, Search } from "lucide-react"
import { mockGroups } from "../services/mockData"
import type { IGroup } from "../types"
import "./GroupList.css"

export const GroupList: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [groups] = useState<IGroup[]>(mockGroups)

  const filteredGroups = groups.filter(
    (group) =>
      group.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.responsable.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    { key: "nombre", header: "Nombre" },
    {
      key: "responsable",
      header: "Responsable",
      render: (group: IGroup) => `${group.responsable.nombre} ${group.responsable.apellidos}`,
    },
    {
      key: "tematicas",
      header: "Temáticas",
      render: (group: IGroup) => group.tematicas.join(", "),
    },
    { key: "facultad", header: "Facultad" },
    { key: "totalIntegrantes", header: "Integrantes" },
    {
      key: "actions",
      header: "Opciones",
      render: (group: IGroup) => (
        <div className="table-actions">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/groups/${group.id}`)
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
          <h1>Grupos de Investigación</h1>
          <p>Gestión de grupos de investigación (Quorum)</p>
        </div>
        <Button onClick={() => navigate("/groups/new")}>
          <Plus size={20} />
          Adicionar Grupo
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

        <Table data={filteredGroups} columns={columns} onRowClick={(group) => navigate(`/groups/${group.id}`)} />
      </Card>
    </div>
  )
}
