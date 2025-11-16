"use client"

import { useState, useEffect } from "react"
import type { IAuditLog } from "../types"
import { auditService } from "../services/auditService"
import { Card } from "../components/common/Card"
import { Input } from "../components/common/Input"
import { Button } from "../components/common/Button"
import { Table } from "../components/common/Table"
import "./AuditLog.css"

export const AuditLog = () => {
  const [logs, setLogs] = useState<IAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    tipoAccion: "",
    fechaInicio: "",
    fechaFin: "",
  })

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const data = await auditService.getLogs(filters)
      setLogs(data)
    } catch (error) {
      console.error("Error loading audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    loadLogs()
  }

  const columns = [
    { key: "fecha", header: "Fecha" },
    { key: "hora", header: "Hora" },
    {
      key: "usuario",
      header: "Usuario",
      render: (log: IAuditLog) => log.usuario.nombreUsuario,
    },
    {
      key: "metodo",
      header: "Método",
      render: (log: IAuditLog) => <span className={`method-badge method-${log.metodo}`}>{log.metodo}</span>,
    },
    { key: "ruta", header: "Ruta" },
    {
      key: "codigo",
      header: "Código",
      render: (log: IAuditLog) => (
        <span className={`code-badge code-${Math.floor(log.codigo / 100)}`}>{log.codigo}</span>
      ),
    },
    { key: "mensaje", header: "Mensaje" },
  ]

  if (loading) return <div className="loading">Cargando bitácora...</div>

  return (
    <div className="audit-log">
      <div className="page-header">
        <h1>Bitácora del Sistema</h1>
        <p>Registro de todas las operaciones realizadas en el sistema</p>
      </div>

      <Card>
        <div className="filters">
          <div className="filter-group">
            <label>Tipo de Acción</label>
            <select
              value={filters.tipoAccion}
              onChange={(e) => setFilters({ ...filters, tipoAccion: e.target.value })}
              className="form-select"
            >
              <option value="">Todas</option>
              <option value="crear">Crear</option>
              <option value="modificar">Modificar</option>
              <option value="eliminar">Eliminar</option>
              <option value="consultar">Consultar</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Fecha Inicio</label>
            <Input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>Fecha Fin</label>
            <Input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
            />
          </div>
          <Button onClick={handleFilter}>Filtrar</Button>
        </div>
      </Card>

      <Card>
        <Table data={logs} columns={columns} />
      </Card>
    </div>
  )
}
