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
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; recordId: string | null }>({
    show: false,
    recordId: null,
  })

  const isAdmin = user?.roles?.includes('admin') || false

  const filteredRecords = records.filter((record) => record.titulo.toLowerCase().includes(searchTerm.toLowerCase()))

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
        isAdmin ? (
          <OptionsMenu
            onView={() => navigate(`/records/${record.id}`)}
            onEdit={() => navigate(`/records/${record.id}/edit`)}
            onDelete={() => setDeleteConfirm({ show: true, recordId: record.id })}
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
        {isAdmin && (
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
        </div>

        <Table data={filteredRecords} columns={columns} />
      </Card>

      {isAdmin && (
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
