"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import "./GroupForm.css"

export const GroupForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    facultad: "",
    departamento: "",
    tematicas: "",
  })

  const facultades = [
    "Informática",
    "Civil",
    "Mecánica",
    "Eléctrica",
    "Industrial",
    "Química",
    "Arquitectura",
    "Electrónica y Telecomunicaciones",
    "Automática y Biomédica",
    "ICB",
    "CETA",
    "DEDER",
    "CREA",
    "Dirección de Extensión Universitaria",
    "Dirección de Economía",
    "Otras",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Submitting group form:", formData)
    // TODO: Connect to backend
    navigate("/groups")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="group-form">
      <div className="form-header">
        <h1>Adicionar Grupo de Investigación</h1>
        <p>Complete la información básica del grupo</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="nombre">
                Nombre del Grupo <span className="required">*</span>
              </label>
              <Input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Grupo de Inteligencia Artificial"
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="descripcion">
                Descripción <span className="required">*</span>
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describa los objetivos y líneas de investigación del grupo"
                rows={4}
                required
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="facultad">
                Facultad <span className="required">*</span>
              </label>
              <select
                id="facultad"
                name="facultad"
                value={formData.facultad}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Seleccione una facultad</option>
                {facultades.map((fac) => (
                  <option key={fac} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="departamento">Departamento o Centro</label>
              <Input
                id="departamento"
                name="departamento"
                type="text"
                value={formData.departamento}
                onChange={handleChange}
                placeholder="Ej: Ingeniería de Software"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="tematicas">
                Temáticas <span className="required">*</span>
              </label>
              <Input
                id="tematicas"
                name="tematicas"
                type="text"
                value={formData.tematicas}
                onChange={handleChange}
                placeholder="Separe las temáticas con comas. Ej: Machine Learning, Deep Learning"
                required
              />
              <small className="form-hint">Separe múltiples temáticas con comas</small>
            </div>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/groups")}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Grupo</Button>
          </div>
        </form>
      </Card>

      <div className="form-info">
        <p>
          <strong>Nota:</strong> Después de guardar el grupo, podrá agregar integrantes, asociar proyectos y registros
          científicos, y gestionar evaluaciones.
        </p>
      </div>
    </div>
  )
}
