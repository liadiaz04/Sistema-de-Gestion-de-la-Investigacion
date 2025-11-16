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
import { mockRecords } from "../services/mockData"
import type { IRecord } from "../types"
import { useAuthStore } from "../stores/authStore"
import "./GroupList.css"

const RecordList: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<IRecord[]>(mockRecords)
  const [recordFilter, setRecordFilter] = useState<"all" | "mine">("all")
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; recordId: string | null }>({
    show: false,
    recordId: null,
  })

  const isAdmin = user?.roles?.includes('admin') || false
  const isAutorRegistro = user?.roles?.includes('autor_registro') || false

  const isAuthor = (record: IRecord): boolean => {
    return record.autores.some(autor => autor.usuario?.id === user?.id)
  }

  const canEdit = (record: IRecord): boolean => {
    if (isAdmin) return true
    if (isAutorRegistro && recordFilter === "mine") return isAuthor(record)
    return false
  }

  const canDelete = (record: IRecord): boolean => {
    if (isAdmin) return true
    if (isAutorRegistro && recordFilter === "mine") return isAuthor(record)
    return false
  }

  const filteredRecords = records
    .filter((record) => {
      const matchesSearch = record.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      if (recordFilter === "mine") {
        return matchesSearch && isAuthor(record)
      }
      return matchesSearch
    })

  const handleDelete = (recordId: string) => {
    setRecords(records.filter((r) => r.id !== recordId))
    setDeleteConfirm({ show: false, recordId: null })
  }

  const columns = [
    { key: "titulo", header: "Título" },
    {
      key: "tipo",
      header: "Tipo",
      render: (record: IRecord) => <span className="badge badge-primary">{record.tipo}</span>,
    },
    {
      key: "autores",
      header: "Autores",
      render: (record: IRecord) => record.autores.map((a) => `${a.nombre} ${a.apellidos}`).join(", "),
    },
    { key: "año", header: "Año" },
    {
      key: "actions",
      header: "Opciones",
      render: (record: IRecord) => (
        canEdit(record) || canDelete(record) ? (
          <OptionsMenu
            onView={() => navigate(`/records/${record.id}`)}
            onEdit={canEdit(record) ? () => navigate(`/records/${record.id}/edit`) : undefined}
            onDelete={canDelete(record) ? () => setDeleteConfirm({ show: true, recordId: record.id }) : undefined}
          />
        ) : (
          <Button variant="outline" onClick={() => navigate(`/records/${record.id}`)}>
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
          <h1>Producción Científica</h1>
          <p>Gestión de registros científicos (Códice)</p>
        </div>
        {(isAdmin || isAutorRegistro) && (
          <Button onClick={() => navigate("/records/new")}>
            <Plus size={20} />
            Adicionar Registro
          </Button>
        )}
      </div>

      <Card>
        <div className="group-list-filters">
          <div className="group-list-search">
            <Search size={20} />
            <Input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAutorRegistro && (
            <div className="filter-group">
              <label>Filtrar:</label>
              <select
                value={recordFilter}
                onChange={(e) => setRecordFilter(e.target.value as "all" | "mine")}
                className="form-select"
              >
                <option value="all">Todos los registros</option>
                <option value="mine">Mis registros</option>
              </select>
            </div>
          )}
        </div>

        <Table data={filteredRecords} columns={columns} />
      </Card>

      {deleteConfirm.recordId && (
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          title="Eliminar Registro"
          message="¿Está seguro que desea eliminar este registro científico? Esta acción no se puede deshacer."
          onConfirm={() => deleteConfirm.recordId && handleDelete(deleteConfirm.recordId)}
          onCancel={() => setDeleteConfirm({ show: false, recordId: null })}
        />
      )}
    </div>
  )
}

export { RecordList }
export default RecordList
