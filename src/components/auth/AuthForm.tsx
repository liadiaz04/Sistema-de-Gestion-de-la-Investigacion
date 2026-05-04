"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "../common/Input"
import { Button } from "../common/Button"
import { Card } from "../common/Card"
import { useAuthStore } from "../../stores/authStore"
import { authService } from "../../services/auth/authService"
import { validateEmailRequired } from "../../utils/validation"
import "./AuthForm.css"

export const AuthForm: React.FC = () => {
  const navigate = useNavigate()
  const { login, updateUser } = useAuthStore()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const emailValidation = validateEmailRequired(username, "Correo electrónico")
    if (emailValidation) {
      setError(emailValidation)
      return
    }

    setLoading(true)

    try {
      const response = await authService.login({ email: username.trim(), password })
      login(response.token)
      // Actualizar el usuario en el store (el authService ya lo guarda en localStorage)
      // Pero necesitamos actualizar el store también
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) {
        try {
          const user = JSON.parse(userFromStorage)
          updateUser(user)
        } catch (parseError) {
          console.error('Error parsing user from storage:', parseError)
        }
      }
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
            label="Correo electrónico"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="usuario@institucion.edu"
            required
            autoComplete="username email"
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
        </form>

        <div className="auth-demo-info">
          <p>
            <strong>Demo:</strong> Correo: jperez@cujae.edu.cu | Contraseña: password123
          </p>
        </div>
      </Card>
    </div>
  )
}
