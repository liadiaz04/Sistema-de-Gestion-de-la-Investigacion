import type { IStatisticsTabular, IStatisticsGraphical, IStatisticData } from "../types"
import { mockGroups, mockProjects, mockRecords } from "./mockData"

class StatisticsService {
  async getTabularStatistics(): Promise<IStatisticsTabular> {
    // Calculate group statistics
    const gruposPorFacultad: Record<string, number> = {}
    const integrantesPorGrupo: Record<string, number> = {}

    mockGroups.forEach((group) => {
      gruposPorFacultad[group.facultad] = (gruposPorFacultad[group.facultad] || 0) + 1
      integrantesPorGrupo[group.nombre] = group.totalIntegrantes
    })

    // Calculate record statistics
    const registrosPorTipo: Record<string, number> = {}
    const totalRegistros = mockRecords.length

    mockRecords.forEach((record) => {
      registrosPorTipo[record.tipo] = (registrosPorTipo[record.tipo] || 0) + 1
    })

    const porcentajeAportePorTipo: Record<string, number> = {}
    Object.keys(registrosPorTipo).forEach((tipo) => {
      porcentajeAportePorTipo[tipo] = (registrosPorTipo[tipo] / totalRegistros) * 100
    })

    // Calculate project statistics
    const proyectosPorFacultad: Record<string, number> = {}
    const integrantesPorProyecto: Record<string, number> = {}

    mockProjects.forEach((project) => {
      const facultad = project.responsable.facultad || "Sin facultad"
      proyectosPorFacultad[facultad] = (proyectosPorFacultad[facultad] || 0) + 1
      integrantesPorProyecto[project.nombre] = 5 // Mock value
    })

    return {
      grupos: {
        total: mockGroups.length,
        porFacultad: gruposPorFacultad,
        integrantesPorGrupo,
      },
      registros: {
        total: totalRegistros,
        porTipo: registrosPorTipo as any,
        porcentajeAportePorTipo: porcentajeAportePorTipo as any,
      },
      proyectos: {
        total: mockProjects.length,
        porFacultad: proyectosPorFacultad,
        integrantesPorProyecto,
      },
    }
  }

  async getGraphicalStatistics(_year?: number | undefined): Promise<IStatisticsGraphical> {
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
      indicadoresRegistrosPorAño: {
        2023: {
          articulo: 45,
          libro: 12,
          tesis: 23,
          patente: 5,
          software: 8,
          evento: 15,
          premio: 3,
          monografia: 6,
          norma: 2,
        },
        2024: {
          articulo: 52,
          libro: 15,
          tesis: 28,
          patente: 7,
          software: 10,
          evento: 18,
          premio: 5,
          monografia: 8,
          norma: 3,
        },
      },
      indicadoresProyectosPorAño: {
        2023: 25,
        2024: 32,
      },
    }
  }

  async generateReport(tipo: "pdf" | "xlsx", data: any): Promise<Blob> {
    // Mock report generation
    const content = JSON.stringify(data, null, 2)
    return new Blob([content], {
      type: tipo === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  }
}

export const statisticsService = new StatisticsService()
