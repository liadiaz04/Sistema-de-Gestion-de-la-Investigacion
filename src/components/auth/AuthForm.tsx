"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "../common/Input"
import { Button } from "../common/Button"
import { Card } from "../common/Card"
import { useAuthStore } from "../../stores/authStore"
import { authService } from "../../services/authService"
import "./AuthForm.css"

export const AuthForm: React.FC = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await authService.login({ username, password })
      login(response.user, response.token)
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <h1>Sistema de Gestión de Investigación</h1>
          <p>Iniciar Sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Nombre de Usuario"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingrese su nombre de usuario"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingrese su contraseña"
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Iniciando sesión..." : "Entrar"}
          </Button>

          <div className="auth-links">
            <a href="/register">Registrarse</a>
            <a href="/forgot-password">¿Olvidó su contraseña?</a>
          </div>
        </form>

        <div className="auth-demo-info">
          <p>
            <strong>Demo:</strong> Usuario: jperez | Contraseña: password123
          </p>
        </div>
      </Card>
    </div>
  )
}
