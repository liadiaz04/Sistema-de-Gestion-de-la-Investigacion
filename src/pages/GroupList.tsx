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
import { mockGroups } from "../services/mockData"
import type { IGroup } from "../types"
import { useAuthStore } from "../stores/authStore"
import "./GroupList.css"

export const GroupList: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.roles?.includes('admin') || false
  const isResponsableGrupo = user?.roles?.includes('responsable_grupo') || false
  
  const [searchTerm, setSearchTerm] = useState("")
  const [groups] = useState<IGroup[]>(() => [...mockGroups])
  const [viewFilter, setViewFilter] = useState<"todos" | "mis_grupos">("todos")
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; groupId: string | null }>({
    show: false,
    groupId: null,
  })

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = 
      group.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.responsable?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    if (isResponsableGrupo && viewFilter === "mis_grupos") {
      return matchesSearch && group.responsable && group.responsable.id === user?.id
    }
    
    return matchesSearch
  })

  const canEditGroup = (group: IGroup) => {
    if (isAdmin) return true
    if (isResponsableGrupo && group.responsable && group.responsable.id === user?.id) return true
    return false
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
      render: (group: IGroup) => group.tematicas.join(", "),
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

  const handleDelete = (groupId: string) => {
    const index = mockGroups.findIndex(g => g.id === groupId)
    if (index !== -1) {
      mockGroups.splice(index, 1)
      setDeleteConfirm({ show: false, groupId: null })
      window.location.reload() // Refresh to show updated list
    }
  }

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
