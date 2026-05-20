"use client"

import { useState, useEffect } from "react"
import type { IAuditLog, IUser } from "../types"
import { traceService, type Trace } from "../services/traceService"
import { integrantService } from "../services/integrantService"
import type { IntegrantWithRoles } from "../types/api/integrant"
import { Card } from "../components/common/Card"
import { Input } from "../components/common/Input"
import { Button } from "../components/common/Button"
import { Table } from "../components/common/Table"
import { Loader2 } from "lucide-react"
import { useToast } from "../contexts/ToastContext"
import "./AuditLog.css"

// Función para mapear IntegrantWithRoles a IUser
const mapIntegrantToIUser = (integrant: IntegrantWithRoles): IUser => {
  const nameParts = integrant.name.split(' ')
  const nombre = nameParts[0] || ''
  const apellidos = nameParts.slice(1).join(' ') || ''

  return {
    id: integrant.id_integrant.toString(),
    nombre,
    apellidos,
    numeroIdentidad: integrant.identity || '',
    correoElectronico: integrant.email || '',
    nombreUsuario: integrant.email?.split('@')[0] || '',
    roles: integrant.roles?.map(r => {
      const roleName = r.role_name.toUpperCase()
      if (roleName === 'ADMIN' || r.id_role === 1) return 'admin'
      if (roleName === 'INTEGRANT' || r.id_role === 2) return 'integrant'
      if (roleName === 'CONSEJO' || r.id_role === 3) return 'consejo'
      return 'usuario'
    }) || [],
    esExterno: integrant.external,
    esAdministrador: integrant.roles?.some(r => r.id_role === 1) || false,
  }
}

// Función para mapear Trace a IAuditLog
const mapTraceToIAuditLog = (trace: Trace, integrantsMap?: Map<number, IUser>): IAuditLog => {
  // Determinar tipo de acción basado en el método
  let tipoAccion: "crear" | "modificar" | "eliminar" | "consultar" = "consultar";
  if (trace.method === "POST") tipoAccion = "crear";
  else if (trace.method === "PUT" || trace.method === "PATCH") tipoAccion = "modificar";
  else if (trace.method === "DELETE") tipoAccion = "eliminar";
  
  // Parsear fecha y hora
  const dateObj = trace.date ? new Date(trace.date) : new Date();
  const fecha = dateObj.toISOString().split("T")[0];
  const hora = dateObj.toTimeString().split(" ")[0];
  
  // Obtener usuario del mapa si está disponible, sino usar datos de trace.integrant o crear básico
  let usuario: IUser;
  
  // Priorizar el mapa de integrantes cargados (datos más completos)
  if (integrantsMap) {
    const integrantData = integrantsMap.get(trace.id_integrant)
    if (integrantData) {
      usuario = integrantData
    } else if (trace.integrant && trace.integrant.name) {
      // Si no está en el mapa pero viene en trace.integrant, usar esos datos
      const nameParts = trace.integrant.name.split(' ')
      usuario = {
        id: trace.integrant.id_integrant.toString(),
        nombre: nameParts[0] || '',
        apellidos: nameParts.slice(1).join(' ') || '',
        numeroIdentidad: '',
        correoElectronico: trace.integrant.email || '',
        nombreUsuario: trace.integrant.email?.split('@')[0] || '',
        roles: [],
        esExterno: false,
        esAdministrador: false,
      }
    } else {
      // Usuario no encontrado, crear objeto básico
      usuario = {
        id: trace.id_integrant.toString(),
        nombre: '',
        apellidos: '',
        numeroIdentidad: '',
        correoElectronico: '',
        nombreUsuario: '',
        roles: [],
        esExterno: false,
        esAdministrador: false,
      }
    }
  } else if (trace.integrant && trace.integrant.name) {
    // Si no hay mapa pero viene trace.integrant, usar esos datos
    const nameParts = trace.integrant.name.split(' ')
    usuario = {
      id: trace.integrant.id_integrant.toString(),
      nombre: nameParts[0] || '',
      apellidos: nameParts.slice(1).join(' ') || '',
      numeroIdentidad: '',
      correoElectronico: trace.integrant.email || '',
      nombreUsuario: trace.integrant.email?.split('@')[0] || '',
      roles: [],
      esExterno: false,
      esAdministrador: false,
    }
  } else {
    // Sin datos de integrante, crear objeto básico
    usuario = {
      id: trace.id_integrant.toString(),
      nombre: '',
      apellidos: '',
      numeroIdentidad: '',
      correoElectronico: '',
      nombreUsuario: '',
      roles: [],
      esExterno: false,
      esAdministrador: false,
    }
  }
  
  // Determinar código de respuesta
  let codigo = 200;
  if (trace.message?.includes('failed') || trace.message?.includes('Error')) {
    codigo = 500;
  }
  
  return {
    id: trace.id_trace?.toString() || `trace-${trace.id_integrant}-${trace.date}`,
    usuario,
    fecha,
    hora,
    tipoAccion,
    origen: "API",
    metodo: (trace.method as "GET" | "POST" | "PUT" | "DELETE") || "GET",
    ruta: trace.route || '',
    codigo,
    mensaje: trace.message || '',
    detalles: trace.response ? { response: trace.response } : undefined,
  };
};

export const AuditLog = () => {
  const { showToast } = useToast()
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
    setLoading(true)
    try {
      // Convertir fechas a formato ISO 8601
      const traceFilters: { start_date?: string; end_date?: string } = {};
      
      if (filters.fechaInicio) {
        // Si solo viene la fecha, agregar hora 00:00:00
        const startDate = new Date(filters.fechaInicio);
        startDate.setHours(0, 0, 0, 0);
        traceFilters.start_date = startDate.toISOString();
      }
      
      if (filters.fechaFin) {
        // Si solo viene la fecha, agregar hora 23:59:59
        const endDate = new Date(filters.fechaFin);
        endDate.setHours(23, 59, 59, 999);
        traceFilters.end_date = endDate.toISOString();
      }
      
      const traces = await traceService.getAllTraces(traceFilters)
      
      // Identificar IDs de integrantes únicos que necesitan ser cargados
      // Cargamos todos los integrantes para asegurar que tenemos los datos completos
      const integrantIdsToLoad = new Set<number>()
      traces.forEach(trace => {
        // Siempre cargar los detalles del integrante para tener datos completos
        integrantIdsToLoad.add(trace.id_integrant)
      })
      
      // Cargar los detalles de los integrantes en paralelo
      const integrantsMap = new Map<number, IUser>()
      if (integrantIdsToLoad.size > 0) {
        const integrantPromises = Array.from(integrantIdsToLoad).map(id => 
          integrantService.getIntegrantById(id).catch(err => {
            console.warn(`Error cargando integrante ${id}:`, err)
            return null
          })
        )
        
        const integrants = await Promise.all(integrantPromises)
        
        integrants.forEach(integrant => {
          if (integrant) {
            const iUser = mapIntegrantToIUser(integrant)
            integrantsMap.set(integrant.id_integrant, iUser)
          }
        })
      }
      
      // Mapear trazas usando el mapa de integrantes
      const mappedLogs = traces.map(trace => mapTraceToIAuditLog(trace, integrantsMap))
      
      // Aplicar filtro de tipo de acción localmente si está seleccionado
      let filteredLogs = mappedLogs;
      if (filters.tipoAccion) {
        filteredLogs = mappedLogs.filter(log => log.tipoAccion === filters.tipoAccion)
      }
      
      setLogs(filteredLogs)
    } catch (err) {
      console.error("Error loading audit logs:", err)
      showToast(err instanceof Error ? err.message : "Error al cargar las trazas", "error")
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

  return (
    <div className="list-page audit-log">
      <div className="page-toolbar list-page__toolbar">
        <p className="page-toolbar__lead">Registro de todas las operaciones realizadas en el sistema.</p>
      </div>

      <Card className="list-page__panel">
        <div className="list-page__filters">
          <div className="list-page__filter-group">
            <label htmlFor="audit-action-filter">Tipo de acción</label>
            <select
              id="audit-action-filter"
              value={filters.tipoAccion}
              onChange={(e) => setFilters({ ...filters, tipoAccion: e.target.value })}
              className="list-page__select"
            >
              <option value="">Todas</option>
              <option value="crear">Crear</option>
              <option value="modificar">Modificar</option>
              <option value="eliminar">Eliminar</option>
              <option value="consultar">Consultar</option>
            </select>
          </div>
          <div className="list-page__filter-group">
            <label htmlFor="audit-date-start">Fecha inicio</label>
            <Input
              id="audit-date-start"
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
            />
          </div>
          <div className="list-page__filter-group">
            <label htmlFor="audit-date-end">Fecha fin</label>
            <Input
              id="audit-date-end"
              type="date"
              value={filters.fechaFin}
              onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
            />
          </div>
          <Button onClick={handleFilter} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Filtrar'}
          </Button>
        </div>
        <div className="list-page__body">
          {loading ? (
            <div className="list-page__loading" role="status" aria-live="polite">
              <Loader2 className="animate-spin" size={32} aria-hidden />
              <span>Cargando trazas...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="list-page__empty">
              <p>No se encontraron trazas</p>
            </div>
          ) : (
            <>
              <p className="list-page__count">
                {logs.length} {logs.length === 1 ? "registro" : "registros"} en la bitácora
              </p>
              <Table data={logs} columns={columns} />
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
