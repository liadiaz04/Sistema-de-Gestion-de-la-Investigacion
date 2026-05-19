"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Users, FolderKanban, FileText, MessageCircle } from "lucide-react"
import { usePermissions } from "../hooks/usePermissions"
import "./Dashboard.css"

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { canCreateRecords, canCreateProjects, canCreateGroups, isIntegrant } = usePermissions()

  const hasCreateQuickActions =
    canCreateRecords() || canCreateProjects() || canCreateGroups()

  const stats = [
    {
      icon: FolderKanban,
      label: "Proyectos",
      color: "var(--color-accent)",
      path: "/projects",
    },
    {
      icon: Users,
      label: "Grupos",
      color: "var(--color-primary-dark)",
      path: "/groups",
    },
    {
      icon: FileText,
      label: "Registros",
      color: "var(--color-primary)",
      path: "/records",
    },
  ]

  const handleNavigateToAssistant = () => {
    navigate("/assistant")
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>
          {isIntegrant()
            ? "Bienvenido. Desde aquí puede consultar la información de investigación de la institución."
            : "Bienvenido al Sistema de Gestión de Investigación"}
        </p>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat) => (
          <Card key={stat.label} className="dashboard-stat-card" padding="lg">
            <div className="dashboard-stat-icon" style={{ backgroundColor: stat.color }}>
              <stat.icon size={24} color="white" />
            </div>
            <div className="dashboard-stat-content">
              <p className="dashboard-stat-label">{stat.label}</p>
            </div>
            <button
              type="button"
              className="dashboard-stat-action"
              onClick={() => navigate(stat.path)}
              aria-label={`Ver listado de ${stat.label}`}
            >
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
          {hasCreateQuickActions ? (
            <>
              <h3>Accesos rápidos</h3>
              <div className="dashboard-quick-actions">
                {canCreateRecords() ? (
                  <button
                    type="button"
                    className="dashboard-quick-action"
                    onClick={() => navigate("/records/new")}
                    aria-label="Crear nuevo registro científico"
                  >
                    <FileText size={20} aria-hidden />
                    <span className="dashboard-quick-action-label">Nuevo registro</span>
                  </button>
                ) : null}
                {canCreateProjects() ? (
                  <button
                    type="button"
                    className="dashboard-quick-action"
                    onClick={() => navigate("/projects/new")}
                    aria-label="Crear nuevo proyecto"
                  >
                    <FolderKanban size={20} aria-hidden />
                    <span className="dashboard-quick-action-label">Nuevo proyecto</span>
                  </button>
                ) : null}
                {canCreateGroups() ? (
                  <button
                    type="button"
                    className="dashboard-quick-action"
                    onClick={() => navigate("/groups/new")}
                    aria-label="Crear nuevo grupo de investigación"
                  >
                    <Users size={20} aria-hidden />
                    <span className="dashboard-quick-action-label">Nuevo grupo</span>
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="dashboard-help-center">
              <h3>Centro de ayuda</h3>
              <div className="dashboard-assistant-info">
                <div className="dashboard-assistant-info-icon" aria-hidden>
                  <MessageCircle size={28} />
                </div>
                <div className="dashboard-assistant-info-content">
                  <p className="dashboard-assistant-info-lead">
                    El <strong>asistente virtual</strong> le orienta sobre el Sistema de Gestión de
                    Investigación: qué son los registros, proyectos y grupos, y cómo consultarlos.
                  </p>
                  <p className="dashboard-assistant-info-text">
                    Escriba sus dudas en lenguaje natural y reciba respuestas al instante. Es un
                    complemento a la consulta de datos; la información oficial sigue estando en los
                    listados de las tarjetas superiores.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="dashboard-quick-action dashboard-help-assistant"
                onClick={handleNavigateToAssistant}
                aria-label="Abrir asistente virtual de investigación"
              >
                <MessageCircle size={20} aria-hidden />
                <span className="dashboard-quick-action-text">
                  <span className="dashboard-quick-action-label">Abrir asistente virtual</span>
                  <span className="dashboard-quick-action-description">
                    Acceso directo al chat de ayuda del sistema
                  </span>
                </span>
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}




