"use client"

import { useState, useEffect } from "react"
import type { IStatisticsTabular, IStatisticsGraphical } from "../types"
import { statisticsService } from "../services/statisticsService"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import "./Statistics.css"

export const Statistics = () => {
  const [view, setView] = useState<"tabular" | "graphical">("tabular")
  const [tabularData, setTabularData] = useState<IStatisticsTabular | null>(null)
  const [graphicalData, setGraphicalData] = useState<IStatisticsGraphical | null>(null)
  const [selectedYear, setSelectedYear] = useState(2024)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [view, selectedYear])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      if (view === "tabular") {
        const data = await statisticsService.getTabularStatistics()
        setTabularData(data)
      } else {
        const data = await statisticsService.getGraphicalStatistics(selectedYear)
        setGraphicalData(data)
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    const data = view === "tabular" ? tabularData : graphicalData
    const blob = await statisticsService.generateReport("pdf", data)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `estadisticas-${view}-${Date.now()}.pdf`
    a.click()
  }

  const handleExportXLSX = async () => {
    const data = view === "tabular" ? tabularData : graphicalData
    const blob = await statisticsService.generateReport("xlsx", data)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `estadisticas-${view}-${Date.now()}.xlsx`
    a.click()
  }

  if (loading) return <div className="loading">Cargando estadísticas...</div>

  return (
    <div className="statistics">
      <div className="page-header">
        <h1>Estadísticas y Reportes</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button className={view === "tabular" ? "active" : ""} onClick={() => setView("tabular")}>
              Vista Tabular
            </button>
            <button className={view === "graphical" ? "active" : ""} onClick={() => setView("graphical")}>
              Vista Gráfica
            </button>
          </div>
          <div className="export-buttons">
            <Button variant="secondary" onClick={handleExportPDF}>
              Exportar PDF
            </Button>
            <Button variant="secondary" onClick={handleExportXLSX}>
              Exportar XLSX
            </Button>
          </div>
        </div>
      </div>

      {view === "tabular" && tabularData && (
        <div className="tabular-view">
          <div className="summary-cards">
            <Card className="summary-card grupos-summary">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <h3>Grupos de Investigación</h3>
                <div className="summary-value">{tabularData.grupos.total}</div>
                <p className="summary-label">Total de grupos activos</p>
              </div>
            </Card>
            <Card className="summary-card registros-summary">
              <div className="summary-icon">📚</div>
              <div className="summary-content">
                <h3>Registros Científicos</h3>
                <div className="summary-value">{tabularData.registros.total}</div>
                <p className="summary-label">Total de publicaciones</p>
              </div>
            </Card>
            <Card className="summary-card proyectos-summary">
              <div className="summary-icon">🔬</div>
              <div className="summary-content">
                <h3>Proyectos de Investigación</h3>
                <div className="summary-value">{tabularData.proyectos.total}</div>
                <p className="summary-label">Proyectos en curso</p>
              </div>
            </Card>
          </div>

          <Card className="stats-card grupos-card">
            <h2>Estadísticas de Grupos</h2>
            <h3>Grupos por Facultad</h3>
            <div className="visual-chart">
              {Object.entries(tabularData.grupos.porFacultad).map(([facultad, cantidad]) => {
                const percentage = (cantidad / tabularData.grupos.total) * 100
                return (
                  <div key={facultad} className="chart-bar-item">
                    <div className="chart-label">{facultad}</div>
                    <div className="chart-bar-container">
                      <div className="chart-bar grupos-bar" style={{ width: `${percentage}%` }}>
                        <span className="chart-value">{cantidad}</span>
                      </div>
                      <span className="chart-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="stats-card registros-card">
            <h2>Estadísticas de Registros</h2>
            <h3>Registros por Tipo</h3>
            <div className="visual-chart">
              {Object.entries(tabularData.registros.porTipo).map(([tipo, cantidad]) => {
                const percentage =
                  tabularData.registros.porcentajeAportePorTipo[
                    tipo as keyof typeof tabularData.registros.porcentajeAportePorTipo
                  ]
                return (
                  <div key={tipo} className="chart-bar-item">
                    <div className="chart-label">{tipo}</div>
                    <div className="chart-bar-container">
                      <div className="chart-bar registros-bar" style={{ width: `${percentage}%` }}>
                        <span className="chart-value">{cantidad}</span>
                      </div>
                      <span className="chart-percentage">{percentage?.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="stats-card proyectos-card">
            <h2>Estadísticas de Proyectos</h2>
            <h3>Proyectos por Facultad</h3>
            <div className="visual-chart">
              {Object.entries(tabularData.proyectos.porFacultad).map(([facultad, cantidad]) => {
                const percentage = (cantidad / tabularData.proyectos.total) * 100
                return (
                  <div key={facultad} className="chart-bar-item">
                    <div className="chart-label">{facultad}</div>
                    <div className="chart-bar-container">
                      <div className="chart-bar proyectos-bar" style={{ width: `${percentage}%` }}>
                        <span className="chart-value">{cantidad}</span>
                      </div>
                      <span className="chart-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {view === "graphical" && graphicalData && (
        <div className="graphical-view">
          <div className="year-selector">
            <label>Año:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          <div className="summary-cards">
            <Card className="summary-card grupos-summary">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <h3>Grupos Totales</h3>
                <div className="summary-value">{graphicalData.gruposTotales}</div>
              </div>
            </Card>
          </div>

          <Card className="chart-card">
            <h2>Grupos por Facultad</h2>
            <div className="visual-chart large">
              {graphicalData.gruposPorFacultad.map((item, index) => {
                const percentage = (item.value / graphicalData.gruposTotales) * 100
                const colors = ["#008353", "#00A86B", "#7FC7AF"]
                return (
                  <div key={item.label} className="chart-bar-item">
                    <div className="chart-label">{item.label}</div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar"
                        style={{
                          width: `${percentage}%`,
                          background: colors[index % colors.length],
                        }}
                      >
                        <span className="chart-value">{item.value}</span>
                      </div>
                      <span className="chart-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <div className="charts-grid">
            <Card className="chart-card">
              <h2>Grupos con Más Resultados</h2>
              <div className="visual-chart">
                {graphicalData.gruposConMasResultados.map((item) => (
                  <div key={item.label} className="chart-bar-item">
                    <div className="chart-label">{item.label}</div>
                    <div className="chart-bar-container">
                      <div className="chart-bar grupos-bar" style={{ width: `${(item.value / 50) * 100}%` }}>
                        <span className="chart-value">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="chart-card">
              <h2>Grupos con Más Artículos</h2>
              <div className="visual-chart">
                {graphicalData.gruposConMasArticulos.map((item) => (
                  <div key={item.label} className="chart-bar-item">
                    <div className="chart-label">{item.label}</div>
                    <div className="chart-bar-container">
                      <div className="chart-bar registros-bar" style={{ width: `${(item.value / 25) * 100}%` }}>
                        <span className="chart-value">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="chart-card">
            <h2>Registros por Tipo - Año {selectedYear}</h2>
            <div className="visual-chart large">
              {Object.entries(graphicalData.indicadoresRegistrosPorAño[selectedYear] || {}).map(
                ([tipo, cantidad], index) => {
                  const colors = ["#008353", "#00A86B", "#7FC7AF", "#A8D5BA", "#5FB88F"]
                  return (
                    <div key={tipo} className="chart-bar-item">
                      <div className="chart-label">{tipo}</div>
                      <div className="chart-bar-container">
                        <div
                          className="chart-bar"
                          style={{
                            width: `${(cantidad / 60) * 100}%`,
                            background: colors[index % colors.length],
                          }}
                        >
                          <span className="chart-value">{cantidad}</span>
                        </div>
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
