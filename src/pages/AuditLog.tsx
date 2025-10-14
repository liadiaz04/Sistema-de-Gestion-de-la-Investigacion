"use client"

import { useState, useEffect } from "react"
import type { IAuditLog } from "../types"
import { auditService } from "../services/auditService"
import { Card } from "../components/common/Card"
import { Input } from "../components/common/Input"
import { Button } from "../components/common/Button"
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
        <div className="table-container">
          <table className="data-table audit-table">
            <thead>
              <tr>
                <th className="date-col">Fecha</th>
                <th className="time-col">Hora</th>
                <th className="user-col">Usuario</th>
                <th className="action-col">Acción</th>
                <th className="method-col">Método</th>
                <th className="route-col">Ruta</th>
                <th className="code-col">Código</th>
                <th className="message-col">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    No hay registros en la bitácora
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="date-col">{log.fecha}</td>
                    <td className="time-col">{log.hora}</td>
                    <td className="user-col">{log.usuario.nombreUsuario}</td>
                    <td className="action-col">
                      <span className={`action-badge action-${log.tipoAccion}`}>{log.tipoAccion}</span>
                    </td>
                    <td className="method-col">
                      <span className={`method-badge method-${log.metodo}`}>{log.metodo}</span>
                    </td>
                    <td className="route-col">{log.ruta}</td>
                    <td className="code-col">
                      <span className={`code-badge code-${Math.floor(log.codigo / 100)}`}>{log.codigo}</span>
                    </td>
                    <td className="message-col">{log.mensaje}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
