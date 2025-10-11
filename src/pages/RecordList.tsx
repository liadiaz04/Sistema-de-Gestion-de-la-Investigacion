"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Table } from "../components/common/Table"
import { Plus, Search } from "lucide-react"
import { mockRecords } from "../services/mockData"
import type { IRecord } from "../types"

export const RecordList: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [records] = useState<IRecord[]>(mockRecords)

  const filteredRecords = records.filter((record) => record.titulo.toLowerCase().includes(searchTerm.toLowerCase()))

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
        <div className="table-actions">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/records/${record.id}`)
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
          <h1>Producción Científica</h1>
          <p>Gestión de registros científicos (Códice)</p>
        </div>
        <Button onClick={() => navigate("/records/new")}>
          <Plus size={20} />
          Adicionar Registro
        </Button>
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

        <Table data={filteredRecords} columns={columns} onRowClick={(record) => navigate(`/records/${record.id}`)} />
      </Card>
    </div>
  )
}
