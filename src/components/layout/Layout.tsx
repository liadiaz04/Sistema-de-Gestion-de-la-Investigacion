"use client"

import React from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"
import { usePermissions } from "../../hooks/usePermissions"
import { Menu, LogOut, Users, FolderKanban, FileText, BarChart3, UserCog, ClipboardList, PieChart, MessageCircle } from 'lucide-react'
import "./Layout.css"

export const Layout: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { isAdmin, hasRole, canViewStatistics, canManageUsers, canViewAuditLog } = usePermissions()
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Grupos", path: "/groups" },
    { icon: FolderKanban, label: "Proyectos", path: "/projects" },
    { icon: FileText, label: "Registros", path: "/records" },
    { icon: MessageCircle, label: "Asistente", path: "/assistant" },
    ...(canViewStatistics() ? [
      { icon: PieChart, label: "Estadísticas", path: "/statistics" },
    ] : []),
    ...(canManageUsers() ? [
      { icon: UserCog, label: "Usuarios", path: "/users" },
    ] : []),
    ...(canViewAuditLog() ? [
      { icon: ClipboardList, label: "Bitácora", path: "/audit" },
    ] : []),
  ]

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="sidebar-header">
          {sidebarOpen ? (
            <h2 className="sidebar-brand-title">SGI</h2>
          ) : null}
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Contraer menú lateral" : "Expandir menú lateral"}
          >
            <Menu size={20} aria-hidden />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button key={item.path} className="sidebar-nav-item" onClick={() => navigate(item.path)}>
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            {sidebarOpen && (
              <div className="sidebar-user-info">
                <p className="sidebar-user-name">
                  {user?.nombre} {user?.apellidos}
                </p>
                <p className="sidebar-user-role">{user?.roles[0]}</p>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
