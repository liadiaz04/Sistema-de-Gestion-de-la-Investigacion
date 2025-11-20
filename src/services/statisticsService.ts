import type { IStatisticsTabular, IStatisticsGraphical, IStatisticData, RecordType } from "../types"
import { mockGroups, mockProjects, mockRecords } from "./mockData"

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000"

async function fetchJson<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(path, API_BASE_URL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }
  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
    },
  })
  if (!res.ok) {
    throw new Error(`Error al llamar ${url.pathname}: ${res.status}`)
  }
  return (await res.json()) as T
}

// Cache simple de facultades para mapear nombre -> id_faculty
let facultiesCache: { id_faculty: number; name: string }[] | null = null

async function getFacultyIdByName(facultyName: string): Promise<number | null> {
  if (!facultyName) return null
  if (!facultiesCache) {
    try {
      // Se asume que existe un endpoint estándar de facultades
      const data = await fetchJson<any[]>("/faculties/")
      facultiesCache = data.map((f) => ({
        id_faculty: f.id_faculty ?? f.id ?? 0,
        name: f.name ?? f.nombre ?? "",
      }))
    } catch (e) {
      console.error("Error cargando facultades para estadísticas:", e)
      facultiesCache = []
    }
  }

  const match =
    facultiesCache.find((f) => f.name === facultyName) ??
    facultiesCache.find((f) => f.name.toLowerCase().includes(facultyName.toLowerCase()))

  return match?.id_faculty ?? null
}

class StatisticsService {
  /**
   * Estadísticas tabulares conectadas al backend.
   * - Registros: totales por tipo a nivel de centro y % de aporte de la facultad seleccionada.
   * - Grupos: totales por facultad y total de integrantes por facultad.
   * - Proyectos: totales por facultad y un estimado de integrantes por facultad.
   */
  async getTabularStatistics(selectedFacultyName?: string): Promise<IStatisticsTabular> {
    // 1) Estadísticas de REGISTROS (totales del centro + % aporte facultad)
    const recordEndpoints: { tipo: RecordType; path: string; countFacultyPath: string }[] = [
      { tipo: "articulo", path: "/articles/", countFacultyPath: "/articles/count/faculty/" },
      { tipo: "libro", path: "/books/", countFacultyPath: "/books/count/faculty/" },
      { tipo: "monografia", path: "/monographs/", countFacultyPath: "/monographs/count/" },
      { tipo: "norma", path: "/norms/", countFacultyPath: "/norms/count/" },
      { tipo: "patente", path: "/patents/", countFacultyPath: "/patents/count/" },
      { tipo: "software", path: "/softwares/", countFacultyPath: "/softwares/count/" },
      { tipo: "evento", path: "/encounters/", countFacultyPath: "/encounters/count/faculty/" },
      { tipo: "premio", path: "/prizes/", countFacultyPath: "/prizes/count/" },
      { tipo: "tesis", path: "/theses/", countFacultyPath: "/theses/count/" },
    ]

    const registrosPorTipo: Record<RecordType, number> = {} as any
    const porcentajeAportePorTipo: Record<RecordType, number> = {} as any

    // Totales a nivel de centro
    await Promise.all(
      recordEndpoints.map(async ({ tipo, path }) => {
        try {
          const data = await fetchJson<any[]>(path)
          registrosPorTipo[tipo] = data.length
        } catch (e) {
          console.error(`Error cargando registros de ${tipo} para tabla:`, e)
          registrosPorTipo[tipo] = 0
        }
      }),
    )

    const totalRegistros = Object.values(registrosPorTipo).reduce((acc, v) => acc + v, 0)

    // Si no hay facultad seleccionada (o es "Todas"), % = 100 por definición
    if (!selectedFacultyName) {
      (Object.keys(registrosPorTipo) as RecordType[]).forEach((tipo) => {
        porcentajeAportePorTipo[tipo] = registrosPorTipo[tipo] > 0 ? 100 : 0
      })
    } else {
      const facultyId = await getFacultyIdByName(selectedFacultyName)

      if (!facultyId) {
        console.warn("No se encontró la facultad para estadísticas de registros:", selectedFacultyName)
        ;(Object.keys(registrosPorTipo) as RecordType[]).forEach((tipo) => {
          porcentajeAportePorTipo[tipo] = 0
        })
      } else {
        // Para cada tipo, llamar a su endpoint de conteo por facultad
        await Promise.all(
          recordEndpoints.map(async ({ tipo, countFacultyPath }) => {
            try {
              const data = await fetchJson<any>(`${countFacultyPath}${facultyId}`)
              // Intentamos leer distintos nombres posibles de campos
              const totalCentro =
                data.total ??
                data.total_records ??
                data.total_articles ??
                data.total_books ??
                data.total_monographs ??
                data.total_norms ??
                data.total_patents ??
                data.total_softwares ??
                data.total_prizes ??
                data.total_theses ??
                data.total_events ??
                registrosPorTipo[tipo]

              const totalFacultad =
                data.faculty_total ??
                data.total_for_faculty ??
                data.count_for_faculty ??
                data.faculty_count ??
                data.count_for_faculty_authors ??
                0

              const base = totalCentro || registrosPorTipo[tipo] || 0
              porcentajeAportePorTipo[tipo] = base > 0 ? (totalFacultad / base) * 100 : 0
            } catch (e) {
              console.error(`Error cargando conteos por facultad para ${tipo}:`, e)
              porcentajeAportePorTipo[tipo] = 0
            }
          }),
        )
      }
    }

    // 2) Estadísticas de GRUPOS usando endpoints reales
    const gruposPorFacultad: Record<string, number> = {}
    const integrantesPorGrupo: Record<string, number> = {}

    try {
      const groupCounts = await fetchJson<any[]>("/groups/count/faculty")
      groupCounts.forEach((item) => {
        const facultad = item.faculty_name ?? item.faculty ?? item.name ?? "Sin facultad"
        const cantidad = item.total_groups ?? item.group_count ?? item.count ?? 0
        gruposPorFacultad[facultad] = (gruposPorFacultad[facultad] || 0) + cantidad
      })
    } catch (e) {
      console.error("Error cargando conteos de grupos por facultad:", e)
      // fallback a mocks
      mockGroups.forEach((group) => {
        gruposPorFacultad[group.facultad] = (gruposPorFacultad[group.facultad] || 0) + 1
      })
    }

    try {
      const groupsWithMembers = await fetchJson<any[]>("/groups/count/by_members")
      groupsWithMembers.forEach((item) => {
        const facultad = item.faculty_name ?? item.faculty ?? "Sin facultad"
        const members = item.total_members ?? item.member_count ?? 0
        integrantesPorGrupo[facultad] = (integrantesPorGrupo[facultad] || 0) + members
      })
    } catch (e) {
      console.error("Error cargando conteos de integrantes por grupo:", e)
      // fallback a mocks
      mockGroups.forEach((group) => {
        integrantesPorGrupo[group.facultad] =
          (integrantesPorGrupo[group.facultad] || 0) + group.totalIntegrantes
      })
    }

    const totalGrupos = Object.values(gruposPorFacultad).reduce((acc, v) => acc + v, 0)

    // 3) Estadísticas de PROYECTOS usando endpoint de conteo por facultad
    const proyectosPorFacultad: Record<string, number> = {}
    const integrantesPorProyecto: Record<string, number> = {}

    try {
      const projectCounts = await fetchJson<any[]>("/projects/count/faculty/")
      projectCounts.forEach((item) => {
        const facultad = item.faculty_name ?? item.faculty ?? item.name ?? "Sin facultad"
        const cantidad = item.total_projects ?? item.project_count ?? item.count ?? 0
        proyectosPorFacultad[facultad] = (proyectosPorFacultad[facultad] || 0) + cantidad
        // Estimación de integrantes: si el backend no expone este dato, usamos un valor medio
        const estimatedMembersPerProject = item.average_members ?? 5
        integrantesPorProyecto[facultad] =
          (integrantesPorProyecto[facultad] || 0) + cantidad * estimatedMembersPerProject
      })
    } catch (e) {
      console.error("Error cargando conteos de proyectos por facultad:", e)
      // fallback a mocks
      mockProjects.forEach((project) => {
        const facultad = project.responsable?.facultad || "Sin facultad"
        proyectosPorFacultad[facultad] = (proyectosPorFacultad[facultad] || 0) + 1
        integrantesPorProyecto[facultad] =
          (integrantesPorProyecto[facultad] || 0) + 5 // mismo valor mock que antes
      })
    }

    const totalProyectos = Object.values(proyectosPorFacultad).reduce((acc, v) => acc + v, 0)

    return {
      grupos: {
        total: totalGrupos,
        porFacultad: gruposPorFacultad,
        integrantesPorGrupo,
      },
      registros: {
        total: totalRegistros,
        porTipo: registrosPorTipo,
        porcentajeAportePorTipo,
      },
      proyectos: {
        total: totalProyectos,
        porFacultad: proyectosPorFacultad,
        integrantesPorProyecto,
      },
    }
  }

  async getGraphicalStatistics(year?: number): Promise<IStatisticsGraphical> {
    const targetYear = year ?? new Date().getFullYear()

    // 1) Estadísticas gráficas de REGISTROS, conectadas al backend
    // Para cada tipo de registro, consultamos su endpoint principal filtrando por año
    const recordEndpoints: { tipo: string; path: string }[] = [
      { tipo: "articulo", path: "/articles/" },
      { tipo: "libro", path: "/books/" },
      { tipo: "monografia", path: "/monographs/" },
      { tipo: "norma", path: "/norms/" },
      { tipo: "patente", path: "/patents/" },
      { tipo: "software", path: "/softwares/" },
      { tipo: "evento", path: "/encounters/" },
      { tipo: "premio", path: "/prizes/" },
      { tipo: "tesis", path: "/theses/" },
    ]

    const indicadoresRegistrosPorAño: Record<number, Record<string, number>> = {}
    indicadoresRegistrosPorAño[targetYear] = {}

    await Promise.all(
      recordEndpoints.map(async ({ tipo, path }) => {
        try {
          const data = await fetchJson<any[]>(path, { year_only: targetYear })
          indicadoresRegistrosPorAño[targetYear][tipo] = data.length
        } catch (e) {
          console.error(`Error cargando registros de ${tipo} para estadísticas:`, e)
          indicadoresRegistrosPorAño[targetYear][tipo] = 0
        }
      }),
    )

    // 2) El resto de estadísticas (grupos / proyectos) se mantienen con los mocks actuales
    const gruposPorFacultad: IStatisticData[] = Object.entries(
      mockGroups.reduce(
        (acc, group) => {
          acc[group.facultad] = (acc[group.facultad] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    ).map(([label, value]) => ({ label, value }))

    return {
      gruposTotales: mockGroups.length,
      gruposPorFacultad,
      gruposConMasResultados: [
        { label: "Grupo A", value: 45 },
        { label: "Grupo B", value: 32 },
        { label: "Grupo C", value: 28 },
      ],
      gruposConMasArticulos: [
        { label: "Grupo A", value: 23 },
        { label: "Grupo B", value: 18 },
        { label: "Grupo C", value: 15 },
      ],
      gruposConMasProyectos: [
        { label: "Grupo A", value: 8 },
        { label: "Grupo B", value: 6 },
        { label: "Grupo C", value: 5 },
      ],
      gruposConMasEstudiantes: [
        { label: "Grupo A", value: 12 },
        { label: "Grupo B", value: 10 },
        { label: "Grupo C", value: 8 },
      ],
      indicadoresRegistrosPorAño,
      indicadoresProyectosPorAño: {
        [targetYear]: mockProjects.length,
      },
    }
  }

  async generateReport(tipo: "pdf" | "xlsx", data: any): Promise<Blob> {
    if (tipo === "pdf") {
      // Generate a simple PDF-like text file
      const content = `
REPORTE DE ESTADÍSTICAS
========================

Datos generados el: ${new Date().toLocaleString()}

${JSON.stringify(data, null, 2)}
      `
      return new Blob([content], { type: "application/pdf" })
    } else {
      // Generate CSV format for Excel compatibility
      let csvContent = "Reporte de Estadísticas\n\n"
      
      if (data.registros) {
        csvContent += "REGISTROS CIENTÍFICOS\n"
        csvContent += "Tipo,Total del Centro,Total de la Facultad,% Aporte\n"
        Object.entries(data.registros.porTipo).forEach(([tipo, total]: [string, any]) => {
          const porcentaje = data.registros.porcentajeAportePorTipo?.[tipo] ?? 0
          const totalFacultad = Math.round(total * (porcentaje / 100))
          csvContent += `${tipo},${total},${totalFacultad},${porcentaje.toFixed(1)}%\n`
        })
        csvContent += "\n"
      }
      
      if (data.grupos) {
        csvContent += "GRUPOS DE INVESTIGACIÓN\n"
        csvContent += "Facultad,Cantidad de Grupos,Total de Integrantes\n"
        Object.entries(data.grupos.porFacultad).forEach(([facultad, cantidad]: [string, any]) => {
          const integrantes = data.grupos.integrantesPorGrupo[facultad] || 0
          csvContent += `${facultad},${cantidad},${integrantes}\n`
        })
        csvContent += "\n"
      }
      
      if (data.proyectos) {
        csvContent += "PROYECTOS DE INVESTIGACIÓN\n"
        csvContent += "Facultad,Cantidad de Proyectos,Total de Integrantes\n"
        Object.entries(data.proyectos.porFacultad).forEach(([facultad, cantidad]: [string, any]) => {
          const integrantes = data.proyectos.integrantesPorProyecto[facultad] || 0
          csvContent += `${facultad},${cantidad},${integrantes}\n`
        })
      }
      
      return new Blob([csvContent], { 
        type: "application/vnd.ms-excel" 
      })
    }
  }
}

export const statisticsService = new StatisticsService()
