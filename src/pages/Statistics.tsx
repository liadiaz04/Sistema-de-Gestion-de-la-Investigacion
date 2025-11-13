"use client"

import { useState, useEffect } from "react"
import type { IStatisticsTabular, IStatisticsGraphical } from "../types"
import { statisticsService } from "../services/statisticsService"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from "recharts"
import "./Statistics.css"

type StatisticsCategory = "registros" | "grupos" | "proyectos"
type GroupVisualizationType = "porFacultad" | "masResultados" | "masProyectos" | "masIntegrantes"
type ProjectVisualizationType = "porFacultad" | "masResultados" | "masIntegrantes" | "porEstado"

export const Statistics = () => {
  const [view, setView] = useState<"tabular" | "graphical">("tabular")
  const [category, setCategory] = useState<StatisticsCategory>("registros")
  const [tabularData, setTabularData] = useState<IStatisticsTabular | null>(null)
  const [graphicalData, setGraphicalData] = useState<IStatisticsGraphical | null>(null)
  const [selectedYear, setSelectedYear] = useState(2024)
  const [loading, setLoading] = useState(true)
  const [selectedFacultad, setSelectedFacultad] = useState<string>("todas")
  const [groupVisualizationType, setGroupVisualizationType] = useState<GroupVisualizationType>("porFacultad")
  const [projectVisualizationType, setProjectVisualizationType] = useState<ProjectVisualizationType>("porFacultad")

  const facultades = [
    "Industrial",
    "Eléctrica",
    "Civil",
    "Mecánica",
    "Arquitectura",
    "Informática",
    "Química",
    "CREA",
    "DEDER",
    "CETA",
    "Defensa",
    "Extensión",
    "Economía",
    "Otra",
    "CEMAT",
    "DML",
  ]

  useEffect(() => {
    loadStatistics()
  }, [view, selectedYear, category])

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
    a.download = `estadisticas-${category}-${view}-${Date.now()}.pdf`
    a.click()
  }

  const handleExportXLSX = async () => {
    const data = view === "tabular" ? tabularData : graphicalData
    const blob = await statisticsService.generateReport("xlsx", data)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `estadisticas-${category}-${view}-${Date.now()}.xlsx`
    a.click()
  }

  const toggleFacultad = (facultad: string) => {
    if (selectedFacultad === facultad) {
      setSelectedFacultad("todas")
    } else {
      setSelectedFacultad(facultad)
    }
  }

  if (loading) return <div className="loading">Cargando estadísticas...</div>

  return (
    <div className="statistics">
      <div className="page-header">
        <h1>Estadísticas y Reportes</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <label>
              <input type="radio" name="view" checked={view === "tabular"} onChange={() => setView("tabular")} />
              Ver tabla
            </label>
            <label>
              <input type="radio" name="view" checked={view === "graphical"} onChange={() => setView("graphical")} />
              Ver gráficos
            </label>
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

      <div className="category-selector">
        <Button variant={category === "registros" ? "primary" : "secondary"} onClick={() => setCategory("registros")}>
          Registros Científicos
        </Button>
        <Button variant={category === "grupos" ? "primary" : "secondary"} onClick={() => setCategory("grupos")}>
          Grupos de Investigación
        </Button>
        <Button variant={category === "proyectos" ? "primary" : "secondary"} onClick={() => setCategory("proyectos")}>
          Proyectos de Investigación
        </Button>
      </div>

      {view === "tabular" && tabularData && (
        <div className="tabular-view">
          {category === "registros" && (
            <>
              <Card className="stats-card registros-card">
                <h2>Estadísticas de Registros Científicos</h2>
                <p className="stats-description">
                  Vista tabular que muestra los totales de cada tipo de registro, los subtotales propios del usuario
                  autenticado y el aporte que estos representan para el Centro.
                </p>

                <div className="stats-table-container">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Tipo de Registro</th>
                        <th>Total Centro</th>
                        <th>Mis Registros</th>
                        <th>% Aporte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(tabularData.registros.porTipo).map(([tipo, total]) => {
                        const misRegistros = Math.floor(total * 0.15) // Mock user contribution
                        const aporte =
                          tabularData.registros.porcentajeAportePorTipo[
                            tipo as keyof typeof tabularData.registros.porcentajeAportePorTipo
                          ]
                        return (
                          <tr key={tipo}>
                            <td className="tipo-label">{tipo}</td>
                            <td className="total-value">{total}</td>
                            <td className="user-value">{misRegistros}</td>
                            <td className="aporte-value">{aporte?.toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                      <tr className="total-row">
                        <td>
                          <strong>Total</strong>
                        </td>
                        <td>
                          <strong>{tabularData.registros.total}</strong>
                        </td>
                        <td>
                          <strong>{Math.floor(tabularData.registros.total * 0.15)}</strong>
                        </td>
                        <td>
                          <strong>15.0%</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {category === "grupos" && (
            <>
              <Card className="stats-card grupos-card">
                <h2>Estadísticas de Grupos de Investigación</h2>
                <p className="stats-description">
                  Vista tabular que muestra los totales de grupos registrados en el sistema, agrupados por criterio de
                  facultad a la que pertenecen, así como el total de integrantes que cada grupo posee.
                </p>

                <div className="stats-table-container">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Facultad</th>
                        <th>Cantidad de Grupos</th>
                        <th>Total de Integrantes</th>
                        <th>Promedio Int./Grupo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(tabularData.grupos.porFacultad).map(([facultad, cantidad]) => {
                        const integrantes = tabularData.grupos.integrantesPorGrupo[facultad] || 0
                        const promedio = cantidad > 0 ? (integrantes / cantidad).toFixed(1) : "0"
                        return (
                          <tr key={facultad}>
                            <td className="facultad-label">{facultad}</td>
                            <td className="grupos-value">{cantidad}</td>
                            <td className="integrantes-value">{integrantes}</td>
                            <td className="promedio-value">{promedio}</td>
                          </tr>
                        )
                      })}
                      <tr className="total-row">
                        <td>
                          <strong>Total</strong>
                        </td>
                        <td>
                          <strong>{tabularData.grupos.total}</strong>
                        </td>
                        <td>
                          <strong>
                            {Object.values(tabularData.grupos.integrantesPorGrupo).reduce((a, b) => a + b, 0)}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {(
                              Object.values(tabularData.grupos.integrantesPorGrupo).reduce((a, b) => a + b, 0) /
                              tabularData.grupos.total
                            ).toFixed(1)}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {category === "proyectos" && (
            <>
              <Card className="stats-card proyectos-card">
                <h2>Estadísticas de Proyectos de Investigación</h2>
                <p className="stats-description">
                  Vista tabular que muestra los totales de proyectos registrados en el sistema, agrupados por facultad y
                  el total de integrantes participantes en cada proyecto.
                </p>

                <div className="stats-table-container">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Facultad</th>
                        <th>Cantidad de Proyectos</th>
                        <th>Total de Integrantes</th>
                        <th>Promedio Int./Proyecto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(tabularData.proyectos.porFacultad).map(([facultad, cantidad]) => {
                        const integrantes = tabularData.proyectos.integrantesPorProyecto[facultad] || 0
                        const promedio = cantidad > 0 ? (integrantes / cantidad).toFixed(1) : "0"
                        return (
                          <tr key={facultad}>
                            <td className="facultad-label">{facultad}</td>
                            <td className="proyectos-value">{cantidad}</td>
                            <td className="integrantes-value">{integrantes}</td>
                            <td className="promedio-value">{promedio}</td>
                          </tr>
                        )
                      })}
                      <tr className="total-row">
                        <td>
                          <strong>Total</strong>
                        </td>
                        <td>
                          <strong>{tabularData.proyectos.total}</strong>
                        </td>
                        <td>
                          <strong>
                            {Object.values(tabularData.proyectos.integrantesPorProyecto).reduce((a, b) => a + b, 0)}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {(
                              Object.values(tabularData.proyectos.integrantesPorProyecto).reduce((a, b) => a + b, 0) /
                              tabularData.proyectos.total
                            ).toFixed(1)}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {view === "graphical" && graphicalData && (
        <div className="graphical-view">
          <div className="filters-container">
            <div className="year-selector">
              <label>Año:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                <option value={2020}>2020</option>
                <option value={2021}>2021</option>
                <option value={2022}>2022</option>
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
              </select>
            </div>

            {category === "registros" && (
              <div className="facultad-selector">
                <label>Facultad:</label>
                <select value={selectedFacultad} onChange={(e) => setSelectedFacultad(e.target.value)}>
                  <option value="todas">Todas las facultades</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Eléctrica">Eléctrica</option>
                  <option value="Civil">Civil</option>
                  <option value="Mecánica">Mecánica</option>
                  <option value="Arquitectura">Arquitectura</option>
                  <option value="Informática">Informática</option>
                  <option value="Química">Química</option>
                  <option value="CREA">CREA</option>
                  <option value="DEDER">DEDER</option>
                  <option value="CETA">CETA</option>
                  <option value="Defensa">Defensa</option>
                  <option value="Extensión">Extensión</option>
                  <option value="Economía">Economía</option>
                  <option value="Otra">Otra</option>
                  <option value="CEMAT">CEMAT</option>
                  <option value="DML">DML</option>
                </select>
              </div>
            )}

            {category === "grupos" && (
              <div className="group-visualization-selector">
                <label>Ver:</label>
                <select
                  value={groupVisualizationType}
                  onChange={(e) => setGroupVisualizationType(e.target.value as GroupVisualizationType)}
                >
                  <option value="porFacultad">Grupos por facultad</option>
                  <option value="masResultados">Grupos con más resultados científicos</option>
                  <option value="masProyectos">Grupos con más proyectos</option>
                  <option value="masIntegrantes">Grupos con más integrantes</option>
                </select>
              </div>
            )}

            {category === "proyectos" && (
              <div className="project-visualization-selector">
                <label>Ver:</label>
                <select
                  value={projectVisualizationType}
                  onChange={(e) => setProjectVisualizationType(e.target.value as ProjectVisualizationType)}
                >
                  <option value="porFacultad">Proyectos por facultad</option>
                  <option value="masResultados">Proyectos con más resultados científicos</option>
                  <option value="masIntegrantes">Proyectos con más integrantes</option>
                  <option value="porEstado">Proyectos por estado</option>
                </select>
              </div>
            )}
          </div>

          {category === "registros" && (
            <Card className="chart-card">
              <h2>Registros Primarios por Tipo - Año {selectedYear}</h2>
              <p className="chart-description">
                Vista gráfica que refleja los indicadores generales de cada tipo de registro contra los indicadores
                parciales de cada área definida en el Sistema para el año especificado.
              </p>

              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart
                  data={Object.entries(graphicalData.indicadoresRegistrosPorAño[selectedYear] || {}).map(
                    ([tipo, total]) => ({
                      tipo,
                      total,
                      Industrial: Math.floor(total * 0.15),
                      Eléctrica: Math.floor(total * 0.12),
                      Civil: Math.floor(total * 0.1),
                      Mecánica: Math.floor(total * 0.08),
                      Arquitectura: Math.floor(total * 0.07),
                      Informática: Math.floor(total * 0.18),
                      Química: Math.floor(total * 0.14),
                    }),
                  )}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="tipo" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" label={{ value: "Total de registros", angle: -90, position: "insideLeft" }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: "Subtotal por facultad", angle: 90, position: "insideRight" }}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar yAxisId="left" dataKey="total" fill="#4A9EFF" name="Total" />
                  <Line yAxisId="right" type="monotone" dataKey="Industrial" stroke="#FFB347" name="Industrial" />
                  <Line yAxisId="right" type="monotone" dataKey="Eléctrica" stroke="#90EE90" name="Eléctrica" />
                  <Line yAxisId="right" type="monotone" dataKey="Civil" stroke="#FF6B6B" name="Civil" />
                  <Line yAxisId="right" type="monotone" dataKey="Mecánica" stroke="#C77DFF" name="Mecánica" />
                  <Line yAxisId="right" type="monotone" dataKey="Arquitectura" stroke="#FF8FAB" name="Arquitectura" />
                  <Line yAxisId="right" type="monotone" dataKey="Informática" stroke="#4ECDC4" name="Informática" />
                  <Line yAxisId="right" type="monotone" dataKey="Química" stroke="#95E1D3" name="Química" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {category === "grupos" && (
            <Card className="chart-card">
              <h2>
                {groupVisualizationType === "porFacultad" && "Cantidad de Grupos por Facultad"}
                {groupVisualizationType === "masResultados" && "Grupos con Más Resultados Científicos"}
                {groupVisualizationType === "masProyectos" && "Grupos con Más Proyectos"}
                {groupVisualizationType === "masIntegrantes" && "Grupos con Más Integrantes"}
              </h2>
              <p className="chart-description">
                Vista gráfica que refleja diversos indicadores asociados a los grupos en los cuales se aprecian
                informaciones relevantes, ancladas a los resultados de estos grupos, sus proyectos e integrantes.
              </p>

              <ResponsiveContainer width="100%" height={400}>
                {groupVisualizationType === "porFacultad" ? (
                  <BarChart
                    data={graphicalData.gruposPorFacultad}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="label" angle={-45} textAnchor="end" height={100} />
                    <YAxis label={{ value: "Cantidad de Grupos", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Grupos" fill="#7BA05B" />
                  </BarChart>
                ) : groupVisualizationType === "masResultados" ? (
                  <BarChart data={graphicalData.gruposConMasResultados} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: "Resultados Científicos", position: "insideBottom" }} />
                    <YAxis dataKey="label" type="category" width={200} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#9C6B6B" name="Resultados" />
                  </BarChart>
                ) : groupVisualizationType === "masProyectos" ? (
                  <BarChart data={graphicalData.gruposConMasProyectos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: "Proyectos", position: "insideBottom" }} />
                    <YAxis dataKey="label" type="category" width={200} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#B8860B" name="Proyectos" />
                  </BarChart>
                ) : (
                  <BarChart data={graphicalData.gruposConMasEstudiantes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: "Integrantes", position: "insideBottom" }} />
                    <YAxis dataKey="label" type="category" width={200} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#7D6B91" name="Integrantes" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Card>
          )}

          {category === "proyectos" && (
            <>
              <Card className="chart-card">
                <h2>
                  {projectVisualizationType === "porFacultad" && `Proyectos por Facultad - Año ${selectedYear}`}
                  {projectVisualizationType === "masResultados" && "Proyectos con Más Resultados Científicos"}
                  {projectVisualizationType === "masIntegrantes" && "Proyectos con Más Integrantes"}
                  {projectVisualizationType === "porEstado" && "Proyectos por Estado"}
                </h2>
                <p className="chart-description">
                  Vista gráfica que refleja diversos indicadores asociados a los proyectos en los cuales se aprecian
                  informaciones relevantes sobre su distribución, resultados e integrantes.
                </p>

                <ResponsiveContainer width="100%" height={400}>
                  {projectVisualizationType === "porFacultad" ? (
                    <BarChart
                      data={graphicalData.gruposPorFacultad}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="label"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        style={{ fontSize: "0.85rem", fontWeight: 500 }}
                      />
                      <YAxis
                        label={{
                          value: "Cantidad de Proyectos",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: "0.9rem", fontWeight: 600 },
                        }}
                        style={{ fontSize: "0.85rem", fontWeight: 500 }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          borderRadius: "0.5rem",
                          border: "1px solid #e0e0e0",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "0.9rem", fontWeight: 600 }} />
                      <Bar dataKey="value" name="Proyectos" fill="#6B8FA3" />
                    </BarChart>
                  ) : projectVisualizationType === "masResultados" ? (
                    <BarChart
                      data={[
                        { label: "Proyecto IA Salud", value: 45 },
                        { label: "Proyecto Energías Renovables", value: 38 },
                        { label: "Proyecto Construcción Sostenible", value: 32 },
                        { label: "Proyecto Automatización Industrial", value: 28 },
                        { label: "Proyecto Química Aplicada", value: 24 },
                      ]}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        label={{
                          value: "Resultados Científicos",
                          position: "insideBottom",
                          style: { fontSize: "0.9rem", fontWeight: 600 },
                        }}
                        style={{ fontSize: "0.85rem", fontWeight: 500 }}
                      />
                      <YAxis
                        dataKey="label"
                        type="category"
                        width={250}
                        style={{ fontSize: "0.85rem", fontWeight: 500 }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          borderRadius: "0.5rem",
                          border: "1px solid #e0e0e0",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="value" fill="#9C6B6B" name="Resultados" />
                    </BarChart>
                  ) : projectVisualizationType === "masIntegrantes" ? (
                    <BarChart
                      data={[
                        { label: "Proyecto IA Salud", value: 15 },
                        { label: "Proyecto Construcción Sostenible", value: 13 },
                        { label: "Proyecto Energías Renovables", value: 12 },
                        { label: "Proyecto Automatización Industrial", value: 10 },
                        { label: "Proyecto Química Aplicada", value: 9 },
                      ]}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        label={{
                          value: "Integrantes",
                          position: "insideBottom",
                          style: { fontSize: "0.9rem", fontWeight: 600 },
                        }}
                        style={{ fontSize: "0.85rem", fontWeight: 500 }}
                      />
                      <YAxis
                        dataKey="label"
                        type="category"
                        width={250}
                        style={{ fontSize: "0.85rem", fontWeight: 500 }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          borderRadius: "0.5rem",
                          border: "1px solid #e0e0e0",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="value" fill="#7D6B91" name="Integrantes" />
                    </BarChart>
                  ) : (
                    <BarChart
                      data={[
                        { label: "Activos", value: 28 },
                        { label: "Finalizados", value: 15 },
                        { label: "En Pausa", value: 5 },
                        { label: "Cancelados", value: 2 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="label" style={{ fontSize: "0.85rem", fontWeight: 500 }} />
                      <YAxis
                        label={{
                          value: "Cantidad de Proyectos",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: "0.9rem", fontWeight: 600 },
                        }}
                        style={{ fontSize: "0.85rem", fontWeight: 500 }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          borderRadius: "0.5rem",
                          border: "1px solid #e0e0e0",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "0.9rem", fontWeight: 600 }} />
                      <Bar dataKey="value" name="Proyectos" fill="#6B8FA3" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h2>Indicadores de Proyectos por Año</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={Object.entries(graphicalData.indicadoresProyectosPorAño).map(([year, count]) => ({
                      año: year,
                      proyectos: count,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="año" />
                    <YAxis label={{ value: "Cantidad de Proyectos", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="proyectos" stroke="#6B9B7C" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Statistics
