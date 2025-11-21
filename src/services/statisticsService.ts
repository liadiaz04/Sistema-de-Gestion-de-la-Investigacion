import type { IStatisticsTabular, IStatisticsGraphical, IStatisticData, RecordType } from "../types"
import { apiClient } from "./api/client"
import { recordMetadataService } from "./record/recordMetadataService"

// Cache de facultades para evitar múltiples llamadas
let facultiesCache: { id_faculty: number; name: string }[] | null = null

async function getFacultiesCache(): Promise<{ id_faculty: number; name: string }[]> {
  if (!facultiesCache) {
    try {
      const faculties = await recordMetadataService.getFaculties()
      facultiesCache = faculties.map((f) => ({
        id_faculty: f.id_faculty,
        name: f.name,
      }))
    } catch (e) {
      console.error("Error cargando facultades:", e)
      facultiesCache = []
    }
  }
  return facultiesCache
}

async function getFacultyIdByName(facultyName: string): Promise<number | null> {
  if (!facultyName || facultyName === "Todas") return null
  const faculties = await getFacultiesCache()
  const match = faculties.find((f) => f.name === facultyName)
  return match?.id_faculty ?? null
}

class StatisticsService {
  /**
   * Estadísticas tabulares conectadas al backend.
   * - Registros: totales por tipo a nivel de centro y % de aporte de la facultad seleccionada.
   * - Grupos: totales por facultad y total de integrantes por facultad.
   * - Proyectos: totales por facultad y total de integrantes por facultad.
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
          const response = await apiClient.get(path)
          const data = Array.isArray(response.data) ? response.data : []
          registrosPorTipo[tipo] = data.length
        } catch (e) {
          console.error(`Error cargando registros de ${tipo} para tabla:`, e)
          registrosPorTipo[tipo] = 0
        }
      }),
    )

    const totalRegistros = Object.values(registrosPorTipo).reduce((acc, v) => acc + v, 0)

    // Si no hay facultad seleccionada (o es "Todas"), % = 100 por definición
    if (!selectedFacultyName || selectedFacultyName === "Todas") {
      ;(Object.keys(registrosPorTipo) as RecordType[]).forEach((tipo) => {
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
              const response = await apiClient.get(`${countFacultyPath}${facultyId}`)
              const data = response.data

              // Intentamos leer distintos nombres posibles de campos según el tipo
              const totalCentro =
                data.total ??
                data.total_articles ??
                data.total_books ??
                data.total_monographs ??
                data.total_norms ??
                data.total_patents ??
                data.total_softwares ??
                data.total_prizes ??
                data.total_theses ??
                data.total_encounters ??
                registrosPorTipo[tipo] ??
                0

              const totalFacultad =
                data.faculty_total ??
                data.total_for_faculty ??
                data.count_for_faculty ??
                data.faculty_count ??
                data.articles_in_faculty ??
                data.books_in_faculty ??
                data.monographs_in_faculty ??
                data.norms_in_faculty ??
                data.patents_in_faculty ??
                data.softwares_in_faculty ??
                data.prizes_in_faculty ??
                data.theses_in_faculty ??
                data.encounters_in_faculty ??
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
      const groupCountsResponse = await apiClient.get("/groups/count/faculty")
      const groupCounts = Array.isArray(groupCountsResponse.data) ? groupCountsResponse.data : []
      groupCounts.forEach((item: any) => {
        const facultad = item.faculty_name ?? item.faculty?.name ?? item.name ?? "Sin facultad"
        const cantidad = item.total_groups ?? item.group_count ?? item.count ?? 0
        gruposPorFacultad[facultad] = (gruposPorFacultad[facultad] || 0) + cantidad
      })
    } catch (e) {
      console.error("Error cargando conteos de grupos por facultad:", e)
    }

    try {
      const groupsWithMembersResponse = await apiClient.get("/groups/count/by_members")
      const groupsWithMembers = Array.isArray(groupsWithMembersResponse.data)
        ? groupsWithMembersResponse.data
        : []

      // Agrupar integrantes por facultad
      const integrantesPorFacultad: Record<string, number> = {}
      groupsWithMembers.forEach((item: any) => {
        const facultad = item.faculty_name ?? item.faculty?.name ?? "Sin facultad"
        const members = item.total_members ?? item.member_count ?? 0
        integrantesPorFacultad[facultad] = (integrantesPorFacultad[facultad] || 0) + members
      })

      // También guardar por grupo individual para compatibilidad
      groupsWithMembers.forEach((item: any) => {
        const groupName = item.group_name ?? item.name ?? "Grupo sin nombre"
        const members = item.total_members ?? item.member_count ?? 0
        integrantesPorGrupo[groupName] = members
      })
    } catch (e) {
      console.error("Error cargando conteos de integrantes por grupo:", e)
    }

    const totalGrupos = Object.values(gruposPorFacultad).reduce((acc, v) => acc + v, 0)

    // 3) Estadísticas de PROYECTOS usando endpoint de conteo por facultad
    const proyectosPorFacultad: Record<string, number> = {}
    const integrantesPorProyecto: Record<string, number> = {}

    try {
      const projectCountsResponse = await apiClient.get("/projects/count/faculty/")
      const projectCounts = Array.isArray(projectCountsResponse.data)
        ? projectCountsResponse.data
        : []
      projectCounts.forEach((item: any) => {
        const facultad = item.faculty_name ?? item.faculty?.name ?? item.name ?? "Sin facultad"
        const cantidad = item.total_projects ?? item.project_count ?? item.count ?? 0
        proyectosPorFacultad[facultad] = (proyectosPorFacultad[facultad] || 0) + cantidad

        // Si el backend proporciona integrantes por proyecto, usarlos
        const integrantes = item.total_members ?? item.member_count ?? 0
        if (integrantes > 0) {
          integrantesPorProyecto[facultad] = (integrantesPorProyecto[facultad] || 0) + integrantes
        }
      })
    } catch (e) {
      console.error("Error cargando conteos de proyectos por facultad:", e)
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

  /**
   * Estadísticas gráficas conectadas al backend.
   * - Registros: total por año filtrado y total por facultad en ese año.
   * - Grupos: cantidad por facultad y grupos con más integrantes (con nombres reales).
   * - Proyectos: cantidad por facultad y proyectos por estado.
   */
  async getGraphicalStatistics(
    year?: number,
    selectedFacultyName?: string,
  ): Promise<IStatisticsGraphical> {
    const targetYear = year ?? new Date().getFullYear()

    // 1) Estadísticas gráficas de REGISTROS
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

    const indicadoresRegistrosPorAño: Record<number, Record<RecordType, number>> = {}
    indicadoresRegistrosPorAño[targetYear] = {} as Record<RecordType, number>

    // Obtener totales por tipo para el año seleccionado
    await Promise.all(
      recordEndpoints.map(async ({ tipo, path }) => {
        try {
          const response = await apiClient.get(path, {
            params: { year_only: targetYear },
          })
          const data = Array.isArray(response.data) ? response.data : []
          indicadoresRegistrosPorAño[targetYear][tipo] = data.length
        } catch (e) {
          console.error(`Error cargando registros de ${tipo} para estadísticas:`, e)
          indicadoresRegistrosPorAño[targetYear][tipo] = 0
        }
      }),
    )

    // Obtener registros por facultad si hay una facultad seleccionada
    let registrosPorFacultadEnAño: Record<string, Record<RecordType, number>> = {}
    if (selectedFacultyName && selectedFacultyName !== "Todas") {
      const facultyId = await getFacultyIdByName(selectedFacultyName)
      if (facultyId) {
        await Promise.all(
          recordEndpoints.map(async ({ tipo, countFacultyPath }) => {
            try {
              const response = await apiClient.get(`${countFacultyPath}${facultyId}`)
              const data = response.data
              const totalFacultad =
                data.faculty_total ??
                data.total_for_faculty ??
                data.count_for_faculty ??
                data.faculty_count ??
                data.articles_in_faculty ??
                data.books_in_faculty ??
                data.monographs_in_faculty ??
                data.norms_in_faculty ??
                data.patents_in_faculty ??
                data.softwares_in_faculty ??
                data.prizes_in_faculty ??
                data.theses_in_faculty ??
                data.encounters_in_faculty ??
                0

              if (!registrosPorFacultadEnAño[selectedFacultyName]) {
                registrosPorFacultadEnAño[selectedFacultyName] = {} as Record<RecordType, number>
              }
              registrosPorFacultadEnAño[selectedFacultyName][tipo] = totalFacultad
            } catch (e) {
              console.error(`Error cargando registros de ${tipo} por facultad:`, e)
            }
          }),
        )
      }
    }

    // 2) Estadísticas de GRUPOS
    let gruposPorFacultad: IStatisticData[] = []
    let gruposConMasEstudiantes: IStatisticData[] = []

    try {
      const groupCountsResponse = await apiClient.get("/groups/count/faculty")
      const groupCounts = Array.isArray(groupCountsResponse.data) ? groupCountsResponse.data : []
      gruposPorFacultad = groupCounts.map((item: any) => ({
        label: item.faculty_name ?? item.faculty?.name ?? item.name ?? "Sin facultad",
        value: item.total_groups ?? item.group_count ?? item.count ?? 0,
      }))
    } catch (e) {
      console.error("Error cargando grupos por facultad:", e)
    }

    try {
      const groupsWithMembersResponse = await apiClient.get("/groups/count/by_members")
      const groupsWithMembers = Array.isArray(groupsWithMembersResponse.data)
        ? groupsWithMembersResponse.data
        : []

      // Ordenar por número de integrantes y tomar los primeros (sin límite de 3)
      gruposConMasEstudiantes = groupsWithMembers
        .map((item: any) => ({
          label: item.group_name ?? item.name ?? "Grupo sin nombre",
          value: item.total_members ?? item.member_count ?? 0,
        }))
        .sort((a, b) => b.value - a.value)
        // Mostrar todos los grupos, no solo 3
    } catch (e) {
      console.error("Error cargando grupos con más integrantes:", e)
    }

    // Obtener total de grupos
    let gruposTotales = 0
    try {
      const groupsResponse = await apiClient.get("/groups/", { params: { limit: 1 } })
      // Si el backend devuelve un total, usarlo; si no, contar los grupos por facultad
      gruposTotales = gruposPorFacultad.reduce((acc, g) => acc + g.value, 0)
    } catch (e) {
      console.error("Error obteniendo total de grupos:", e)
    }

    // 3) Estadísticas de PROYECTOS
    let proyectosPorFacultad: IStatisticData[] = []
    let proyectosPorEstado: IStatisticData[] = []

    try {
      const projectCountsResponse = await apiClient.get("/projects/count/faculty/")
      const projectCounts = Array.isArray(projectCountsResponse.data)
        ? projectCountsResponse.data
        : []
      proyectosPorFacultad = projectCounts.map((item: any) => ({
        label: item.faculty_name ?? item.faculty?.name ?? item.name ?? "Sin facultad",
        value: item.total_projects ?? item.project_count ?? item.count ?? 0,
      }))
    } catch (e) {
      console.error("Error cargando proyectos por facultad:", e)
    }

    // Obtener proyectos por estado
    try {
      const projectsResponse = await apiClient.get("/projects/", { params: { limit: 1000 } })
      const projects = Array.isArray(projectsResponse.data) ? projectsResponse.data : []

      const estadoCounts: Record<string, number> = {}
      projects.forEach((project: any) => {
        const estado = project.state ?? project.estado ?? project.id_project_state?.name ?? "Sin estado"
        estadoCounts[estado] = (estadoCounts[estado] || 0) + 1
      })

      proyectosPorEstado = Object.entries(estadoCounts).map(([label, value]) => ({
        label,
        value,
      }))
    } catch (e) {
      console.error("Error cargando proyectos por estado:", e)
    }

    // Obtener indicadores de proyectos por año
    const indicadoresProyectosPorAño: Record<number, number> = {}
    try {
      const projectsResponse = await apiClient.get("/projects/", { params: { limit: 1000 } })
      const projects = Array.isArray(projectsResponse.data) ? projectsResponse.data : []

      projects.forEach((project: any) => {
        const startDate = project.start_date ?? project.fecha_inicio
        if (startDate) {
          const projectYear = new Date(startDate).getFullYear()
          indicadoresProyectosPorAño[projectYear] = (indicadoresProyectosPorAño[projectYear] || 0) + 1
        }
      })
    } catch (e) {
      console.error("Error cargando proyectos por año:", e)
    }

    return {
      gruposTotales,
      gruposPorFacultad,
      gruposConMasResultados: gruposConMasEstudiantes, // Reutilizamos los grupos con más integrantes
      gruposConMasArticulos: [], // Por ahora vacío, se puede implementar después
      gruposConMasProyectos: [], // Por ahora vacío, se puede implementar después
      gruposConMasEstudiantes,
      indicadoresRegistrosPorAño,
      indicadoresProyectosPorAño,
      // Datos adicionales para gráficos de proyectos y registros por facultad
      proyectosPorFacultad,
      proyectosPorEstado,
      registrosPorFacultadEnAño,
    } as any
  }

  async generateReport(
    tipo: "pdf" | "xlsx",
    data: any,
    category?: "registros" | "grupos" | "proyectos",
    view?: "tabular" | "graphical",
  ): Promise<Blob> {
    const fecha = new Date().toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })

    if (tipo === "pdf") {
      // Generar contenido PDF (texto formateado)
      let content = `REPORTE DE ESTADÍSTICAS\n`
      content += `========================\n\n`
      content += `Fecha de generación: ${fecha}\n`
      content += `Categoría: ${category || "General"}\n`
      content += `Vista: ${view || "General"}\n\n`

      if (view === "tabular" && data.registros) {
        content += `REGISTROS CIENTÍFICOS\n`
        content += `----------------------\n`
        content += `Tipo\tTotal del Centro\tTotal de la Facultad\t% Aporte\n`
        Object.entries(data.registros.porTipo || {}).forEach(([tipo, total]: [string, any]) => {
          const porcentaje = data.registros.porcentajeAportePorTipo?.[tipo] ?? 0
          const totalFacultad = Math.round((total * porcentaje) / 100)
          content += `${tipo}\t${total}\t${totalFacultad}\t${porcentaje.toFixed(1)}%\n`
        })
        const totalRegistros = Object.values(data.registros.porTipo || {}).reduce(
          (acc: number, v: any) => acc + v,
          0,
        )
        const totalFacultad = Object.values(data.registros.porTipo || {}).reduce(
          (acc: number, tipo: any) => {
            const porcentaje = data.registros.porcentajeAportePorTipo?.[tipo] ?? 0
            return acc + Math.round((data.registros.porTipo[tipo] * porcentaje) / 100)
          },
          0,
        )
        const porcentajeTotal = totalRegistros > 0 ? (totalFacultad / totalRegistros) * 100 : 0
        content += `TOTAL\t${totalRegistros}\t${totalFacultad}\t${porcentajeTotal.toFixed(1)}%\n\n`
      }

      if (view === "tabular" && data.grupos) {
        content += `GRUPOS DE INVESTIGACIÓN\n`
        content += `------------------------\n`
        content += `Facultad\tCantidad de Grupos\tTotal de Integrantes\n`
        Object.entries(data.grupos.porFacultad || {}).forEach(([facultad, cantidad]: [string, any]) => {
          // Sumar integrantes de todos los grupos de esta facultad
          const integrantes = Object.entries(data.grupos.integrantesPorGrupo || {})
            .filter(([groupName]) => {
              // Si tenemos información de grupos por facultad, usarla
              return true // Por ahora sumamos todos
            })
            .reduce((acc, [, count]: [string, any]) => acc + (count || 0), 0)
          content += `${facultad}\t${cantidad}\t${integrantes}\n`
        })
        content += `TOTAL\t${data.grupos.total || 0}\t${Object.values(data.grupos.integrantesPorGrupo || {}).reduce((acc: number, v: any) => acc + v, 0)}\n\n`
      }

      if (view === "tabular" && data.proyectos) {
        content += `PROYECTOS DE INVESTIGACIÓN\n`
        content += `--------------------------\n`
        content += `Facultad\tCantidad de Proyectos\tTotal de Integrantes\n`
        Object.entries(data.proyectos.porFacultad || {}).forEach(([facultad, cantidad]: [string, any]) => {
          const integrantes = data.proyectos.integrantesPorProyecto?.[facultad] || 0
          content += `${facultad}\t${cantidad}\t${integrantes}\n`
        })
        content += `TOTAL\t${data.proyectos.total || 0}\t${Object.values(data.proyectos.integrantesPorProyecto || {}).reduce((acc: number, v: any) => acc + v, 0)}\n\n`
      }

      if (view === "graphical") {
        if (data.indicadoresRegistrosPorAño) {
          content += `REGISTROS POR AÑO\n`
          content += `------------------\n`
          Object.entries(data.indicadoresRegistrosPorAño).forEach(([año, registros]: [string, any]) => {
            content += `Año ${año}:\n`
            Object.entries(registros).forEach(([tipo, total]: [string, any]) => {
              content += `  ${tipo}: ${total}\n`
            })
          })
          content += `\n`
        }

        if (data.gruposPorFacultad) {
          content += `GRUPOS POR FACULTAD\n`
          content += `--------------------\n`
          data.gruposPorFacultad.forEach((item: IStatisticData) => {
            content += `${item.label}: ${item.value}\n`
          })
          content += `\n`
        }

        if (data.gruposConMasEstudiantes) {
          content += `GRUPOS CON MÁS INTEGRANTES\n`
          content += `--------------------------\n`
          data.gruposConMasEstudiantes.forEach((item: IStatisticData) => {
            content += `${item.label}: ${item.value} integrantes\n`
          })
          content += `\n`
        }

        if (data.proyectosPorFacultad) {
          content += `PROYECTOS POR FACULTAD\n`
          content += `----------------------\n`
          data.proyectosPorFacultad.forEach((item: IStatisticData) => {
            content += `${item.label}: ${item.value}\n`
          })
          content += `\n`
        }

        if (data.proyectosPorEstado) {
          content += `PROYECTOS POR ESTADO\n`
          content += `--------------------\n`
          data.proyectosPorEstado.forEach((item: IStatisticData) => {
            content += `${item.label}: ${item.value}\n`
          })
          content += `\n`
        }
      }

      return new Blob([content], { type: "application/pdf" })
    } else {
      // Generar CSV para Excel
      let csvContent = "Reporte de Estadísticas\n"
      csvContent += `Fecha de generación: ${fecha}\n`
      csvContent += `Categoría: ${category || "General"}\n`
      csvContent += `Vista: ${view || "General"}\n\n`

      if (view === "tabular" && data.registros) {
        csvContent += "REGISTROS CIENTÍFICOS\n"
        csvContent += "Tipo,Total del Centro,Total de la Facultad,% Aporte\n"
        Object.entries(data.registros.porTipo || {}).forEach(([tipo, total]: [string, any]) => {
          const porcentaje = data.registros.porcentajeAportePorTipo?.[tipo] ?? 0
          const totalFacultad = Math.round((total * porcentaje) / 100)
          csvContent += `${tipo},${total},${totalFacultad},${porcentaje.toFixed(1)}%\n`
        })
        const totalRegistros = Object.values(data.registros.porTipo || {}).reduce(
          (acc: number, v: any) => acc + v,
          0,
        )
        const totalFacultad = Object.values(data.registros.porTipo || {}).reduce(
          (acc: number, tipo: any) => {
            const porcentaje = data.registros.porcentajeAportePorTipo?.[tipo] ?? 0
            return acc + Math.round((data.registros.porTipo[tipo] * porcentaje) / 100)
          },
          0,
        )
        const porcentajeTotal = totalRegistros > 0 ? (totalFacultad / totalRegistros) * 100 : 0
        csvContent += `TOTAL,${totalRegistros},${totalFacultad},${porcentajeTotal.toFixed(1)}%\n\n`
      }

      if (view === "tabular" && data.grupos) {
        csvContent += "GRUPOS DE INVESTIGACIÓN\n"
        csvContent += "Facultad,Cantidad de Grupos,Total de Integrantes\n"
        Object.entries(data.grupos.porFacultad || {}).forEach(([facultad, cantidad]: [string, any]) => {
          const integrantes = Object.values(data.grupos.integrantesPorGrupo || {}).reduce(
            (acc: number, v: any) => acc + v,
            0,
          )
          csvContent += `${facultad},${cantidad},${integrantes}\n`
        })
        csvContent += `TOTAL,${data.grupos.total || 0},${Object.values(data.grupos.integrantesPorGrupo || {}).reduce((acc: number, v: any) => acc + v, 0)}\n\n`
      }

      if (view === "tabular" && data.proyectos) {
        csvContent += "PROYECTOS DE INVESTIGACIÓN\n"
        csvContent += "Facultad,Cantidad de Proyectos,Total de Integrantes\n"
        Object.entries(data.proyectos.porFacultad || {}).forEach(([facultad, cantidad]: [string, any]) => {
          const integrantes = data.proyectos.integrantesPorProyecto?.[facultad] || 0
          csvContent += `${facultad},${cantidad},${integrantes}\n`
        })
        csvContent += `TOTAL,${data.proyectos.total || 0},${Object.values(data.proyectos.integrantesPorProyecto || {}).reduce((acc: number, v: any) => acc + v, 0)}\n\n`
      }

      return new Blob([csvContent], {
        type: "application/vnd.ms-excel",
      })
    }
  }
}

export const statisticsService = new StatisticsService()
