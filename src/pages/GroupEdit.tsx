"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { mockGroups } from "../services/mockData"
import { useAuthStore } from "../stores/authStore"
import "./GroupForm.css"

export const GroupEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user: currentUser } = useAuthStore()
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    facultad: "",
    area: "",
    departamento: "",
    tematicas: "",
  })

  useEffect(() => {
    if (id) {
      const group = mockGroups.find((g) => g.id === id)
      if (group) {
        setFormData({
          nombre: group.nombre,
          descripcion: group.descripcion || "",
          facultad: group.facultad || "",
          area: group.area || "",
          departamento: group.departamento || "",
          tematicas: group.tematicas.join(", ") || "",
        })
      } else {
        navigate("/groups")
      }
    }
  }, [id, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!id || !currentUser) {
      return
    }

    const index = mockGroups.findIndex((g) => g.id === id)
    if (index !== -1) {
      mockGroups[index] = {
        ...mockGroups[index],
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        facultad: formData.facultad,
        area: formData.area,
        departamento: formData.departamento,
        tematicas: formData.tematicas.split(",").map((t) => t.trim()),
        fechaActualizacion: new Date().toISOString(),
      }

      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/groups")
      }, 1500)
    }
  }

  return (
    <div className="group-form">
      {showSuccessDialog && (
        <div className="success-dialog-overlay">
          <div className="success-dialog">
            <div className="success-icon">✓</div>
            <h2>Grupo actualizado con éxito</h2>
            <Button onClick={() => setShowSuccessDialog(false)}>Aceptar</Button>
          </div>
        </div>
      )}

      <div className="form-header">
        <h1>Editar Grupo de Investigación</h1>
        <p>Modifique la información del grupo</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Grupo *</label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Grupo de Investigación en IA"
              required
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describa el enfoque y objetivos del grupo"
              className="form-textarea"
            />
          </div>
          <div className="form-group">
            <label>Facultad</label>
            <Input
              value={formData.facultad}
              onChange={(e) => setFormData({ ...formData, facultad: e.target.value })}
              placeholder="Facultad"
            />
          </div>
          <div className="form-group">
            <label>Área</label>
            <Input
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="Área"
            />
          </div>
          <div className="form-group">
            <label>Departamento</label>
            <Input
              value={formData.departamento}
              onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
              placeholder="Departamento"
            />
          </div>
          <div className="form-group">
            <label>Temáticas</label>
            <Input
              value={formData.tematicas}
              onChange={(e) => setFormData({ ...formData, tematicas: e.target.value })}
              placeholder="Ej: IA, Machine Learning, NLP"
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/groups")}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
