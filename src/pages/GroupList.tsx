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
import { Plus, Search } from "lucide-react"
import { mockGroups } from "../services/mockData"
import type { IGroup } from "../types"
import "./GroupList.css"

export const GroupList: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [groups, setGroups] = useState<IGroup[]>(() => [...mockGroups])
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; groupId: string | null }>({
    show: false,
    groupId: null,
  })

  const filteredGroups = groups.filter(
    (group) =>
      group.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.responsable.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId))
    setDeleteConfirm({ show: false, groupId: null })
  }

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
        <OptionsMenu
          onView={() => navigate(`/groups/${group.id}/view`)}
          onEdit={() => navigate(`/groups/${group.id}/edit`)}
          onDelete={() => setDeleteConfirm({ show: true, groupId: group.id })}
        />
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

        <Table data={filteredGroups} columns={columns} />
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
