import { jsPDF } from "jspdf"
import * as XLSX from "xlsx"
import type { IStatisticsTabular, IStatisticsGraphical, IStatisticData, RecordType } from "../types"

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

function totalFacultadRegistros(registros: IStatisticsTabular["registros"]): number {
  return (Object.keys(registros.porTipo || {}) as RecordType[]).reduce((acc, tipo) => {
    const total = registros.porTipo[tipo] ?? 0
    const p = registros.porcentajeAportePorTipo?.[tipo] ?? 0
    return acc + Math.round((total * p) / 100)
  }, 0)
}

/**
 * Mismo texto que el informe: sirve de base para un PDF real (no texto con extensión .pdf).
 */
export const buildStatisticsPlainText = (
  data: IStatisticsTabular | IStatisticsGraphical | any,
  category: "registros" | "grupos" | "proyectos" | undefined,
  view: "tabular" | "graphical" | undefined,
  fecha: string,
): string => {
  let content = `REPORTE DE ESTADÍSTICAS\n`
  content += `========================\n\n`
  content += `Fecha de generación: ${fecha}\n`
  content += `Categoría: ${category || "General"}\n`
  content += `Vista: ${view || "General"}\n\n`

  if (view === "tabular" && data?.registros) {
    content += `REGISTROS CIENTÍFICOS\n`
    content += `----------------------\n`
    content += `Tipo\tTotal del Centro\tTotal de la Facultad\t% Aporte\n`
    Object.entries(data.registros.porTipo || {}).forEach(([tipo, total]: [string, any]) => {
      const porcentaje = data.registros.porcentajeAportePorTipo?.[tipo] ?? 0
      const fac = Math.round((Number(total) * porcentaje) / 100)
      content += `${tipo}\t${total}\t${fac}\t${porcentaje.toFixed(1)}%\n`
    })
    const totalRegistros = Object.values(data.registros.porTipo || {}).reduce(
      (acc: number, v: any) => acc + v,
      0,
    )
    const totalFac = totalFacultadRegistros(data.registros)
    const porcentajeTotal = totalRegistros > 0 ? (totalFac / totalRegistros) * 100 : 0
    content += `TOTAL\t${totalRegistros}\t${totalFac}\t${porcentajeTotal.toFixed(1)}%\n\n`
  }

  if (view === "tabular" && data?.grupos) {
    content += `GRUPOS DE INVESTIGACIÓN\n`
    content += `------------------------\n`
    content += `Facultad\tCantidad de Grupos\tTotal de Integrantes (por fila)\n`
    Object.entries(data.grupos.porFacultad || {}).forEach(([facultad, cantidad]: [string, any]) => {
      const integrantes = data.grupos.integrantesPorGrupo?.[facultad] ?? 0
      content += `${facultad}\t${cantidad}\t${integrantes}\n`
    })
    const sumInt = Object.values(data.grupos.integrantesPorGrupo || {}).reduce(
      (acc: number, v: any) => acc + v,
      0,
    )
    content += `TOTAL\t${data.grupos.total || 0}\t${sumInt}\n\n`
  }

  if (view === "tabular" && data?.proyectos) {
    content += `PROYECTOS DE INVESTIGACIÓN\n`
    content += `--------------------------\n`
    content += `Facultad\tCantidad de Proyectos\tTotal de Integrantes\n`
    Object.entries(data.proyectos.porFacultad || {}).forEach(([facultad, cantidad]: [string, any]) => {
      const integrantes = data.proyectos.integrantesPorProyecto?.[facultad] || 0
      content += `${facultad}\t${cantidad}\t${integrantes}\n`
    })
    const sumI = Object.values(data.proyectos.integrantesPorProyecto || {}).reduce(
      (acc: number, v: any) => acc + v,
      0,
    )
    content += `TOTAL\t${data.proyectos.total || 0}\t${sumI}\n\n`
  }

  if (view === "graphical" && data) {
    if (data.indicadoresRegistrosPorAño) {
      content += `REGISTROS POR AÑO\n`
      content += `------------------\n`
      Object.entries(data.indicadoresRegistrosPorAño).forEach(([año, registros]: [string, any]) => {
        content += `Año ${año}:\n`
        Object.entries(registros).forEach(([t, total]: [string, any]) => {
          content += `  ${t}: ${total}\n`
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

  return content
}

export const plainTextToPdfBlob = (content: string): Blob => {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 12
  const maxLineWidth = pageWidth - 2 * margin
  let y = margin
  const lineHeight = 4.3
  const lines = content.split("\n")
  for (const rawLine of lines) {
    const wrapped = doc.splitTextToSize(rawLine, maxLineWidth) as string[]
    for (const line of wrapped) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += lineHeight
    }
  }
  return doc.output("blob")
}

function workbookToXlsxBlob(wb: XLSX.WorkBook): Blob {
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" })
  return new Blob([buf], { type: XLSX_MIME })
}

export const buildEmptyXlsxInfoBlob = (): Blob => {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    [
      "Para exportar a Excel con tablas, seleccione «Ver tabla» y luego use «Exportar XLSX».",
    ],
  ])
  XLSX.utils.book_append_sheet(wb, ws, "Información")
  return workbookToXlsxBlob(wb)
}

export const buildTabularStatisticsXlsxBlob = (
  data: IStatisticsTabular,
  fecha: string,
  category: "registros" | "grupos" | "proyectos" | undefined,
  view: "tabular" | "graphical" | undefined,
): Blob => {
  const rows: (string | number)[][] = [
    ["Reporte de Estadísticas"],
    ["Fecha de generación", fecha],
    ["Categoría", String(category || "General")],
    ["Vista", String(view || "General")],
    [],
  ]

  if (data.registros) {
    rows.push(["REGISTROS CIENTÍFICOS"])
    rows.push(["Tipo", "Total del Centro", "Total de la Facultad", "% Aporte"])
    Object.entries(data.registros.porTipo || {}).forEach(([tipo, total]) => {
      const p = data.registros.porcentajeAportePorTipo?.[tipo as RecordType] ?? 0
      const tf = Math.round((Number(total) * p) / 100)
      rows.push([tipo, total, tf, `${p.toFixed(1)}%`])
    })
    const totalR = Object.values(data.registros.porTipo || {}).reduce((a, v) => a + v, 0)
    const totalF = totalFacultadRegistros(data.registros)
    const pTot = totalR > 0 ? (totalF / totalR) * 100 : 0
    rows.push(["TOTAL", totalR, totalF, `${pTot.toFixed(1)}%`])
    rows.push([])
  }

  if (data.grupos) {
    rows.push(["GRUPOS DE INVESTIGACIÓN"])
    rows.push(["Facultad", "Cantidad de Grupos", "Integrantes (por facultad)"])
    Object.entries(data.grupos.porFacultad || {}).forEach(([fac, cnt]) => {
      const integ = data.grupos.integrantesPorGrupo?.[fac] ?? 0
      rows.push([fac, cnt, integ])
    })
    const sumI = Object.values(data.grupos.integrantesPorGrupo || {}).reduce((a, b) => a + b, 0)
    rows.push(["TOTAL", data.grupos.total ?? 0, sumI])
    rows.push([])
  }

  if (data.proyectos) {
    rows.push(["PROYECTOS DE INVESTIGACIÓN"])
    rows.push(["Facultad", "Cantidad de Proyectos", "Integrantes (por facultad)"])
    Object.entries(data.proyectos.porFacultad || {}).forEach(([fac, cnt]) => {
      const integ = data.proyectos.integrantesPorProyecto?.[fac] ?? 0
      rows.push([fac, cnt, integ])
    })
    const sumP = Object.values(data.proyectos.integrantesPorProyecto || {}).reduce((a, b) => a + b, 0)
    rows.push(["TOTAL", data.proyectos.total ?? 0, sumP])
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws["!cols"] = [{ wch: 32 }, { wch: 22 }, { wch: 28 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, ws, "Estadísticas")
  return workbookToXlsxBlob(wb)
}
