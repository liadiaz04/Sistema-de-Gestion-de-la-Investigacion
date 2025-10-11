"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Users, FolderKanban, FileText, TrendingUp } from "lucide-react"
import { mockDashboardSummary } from "../services/mockData"
import "./Dashboard.css"

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  const stats = [
    {
      icon: FileText,
      label: "Mis Registros",
      value: mockDashboardSummary.misRegistros,
      color: "var(--color-primary)",
      path: "/records",
    },
    {
      icon: FolderKanban,
      label: "Mis Proyectos",
      value: mockDashboardSummary.misProyectos,
      color: "var(--color-accent)",
      path: "/projects",
    },
    {
      icon: Users,
      label: "Mis Grupos",
      value: mockDashboardSummary.misGrupos,
      color: "var(--color-primary-dark)",
      path: "/groups",
    },
    {
      icon: TrendingUp,
      label: "Proyectos Activos",
      value: mockDashboardSummary.proyectosActivos,
      color: "var(--color-accent-light)",
      path: "/projects",
    },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Bienvenido al Sistema de Gestión de Investigación</p>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat) => (
          <Card key={stat.label} className="dashboard-stat-card" padding="lg">
            <div className="dashboard-stat-icon" style={{ backgroundColor: stat.color }}>
              <stat.icon size={24} color="white" />
            </div>
            <div className="dashboard-stat-content">
              <p className="dashboard-stat-label">{stat.label}</p>
              <p className="dashboard-stat-value">{stat.value}</p>
            </div>
            <button className="dashboard-stat-action" onClick={() => navigate(stat.path)}>
              Ver más →
            </button>
          </Card>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card className="dashboard-card">
          <h3>Actividad Reciente</h3>
          <div className="dashboard-activity">
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-icon">
                <FileText size={16} />
              </div>
              <div className="dashboard-activity-content">
                <p className="dashboard-activity-title">Nuevo artículo publicado</p>
                <p className="dashboard-activity-time">Hace 2 horas</p>
              </div>
            </div>
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-icon">
                <FolderKanban size={16} />
              </div>
              <div className="dashboard-activity-content">
                <p className="dashboard-activity-title">Proyecto actualizado</p>
                <p className="dashboard-activity-time">Hace 5 horas</p>
              </div>
            </div>
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-icon">
                <Users size={16} />
              </div>
              <div className="dashboard-activity-content">
                <p className="dashboard-activity-title">Nuevo integrante en grupo</p>
                <p className="dashboard-activity-time">Hace 1 día</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="dashboard-card">
          <h3>Accesos Rápidos</h3>
          <div className="dashboard-quick-actions">
            <button className="dashboard-quick-action" onClick={() => navigate("/records/new")}>
              <FileText size={20} />
              <span>Nuevo Registro</span>
            </button>
            <button className="dashboard-quick-action" onClick={() => navigate("/projects/new")}>
              <FolderKanban size={20} />
              <span>Nuevo Proyecto</span>
            </button>
            <button className="dashboard-quick-action" onClick={() => navigate("/groups/new")}>
              <Users size={20} />
              <span>Nuevo Grupo</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
