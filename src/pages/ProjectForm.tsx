"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import "./ProjectForm.css"

export const ProjectForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isSaved, setIsSaved] = useState(false)
  const [activeTab, setActiveTab] = useState("datos-iniciales")

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    responsableId: "",
    tematica: "",
    programa: "",
    esPriorizado: false,
    estaAprobado: false,
    estado: "propuesta" as "propuesta" | "activo" | "finalizado" | "cancelado",
    objetivos: "",
    tareas: "",
    detallesCientificos: "",
    otrosDatos: "",
    criterioConsejo: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Submitting project form:", formData)
    // TODO: Connect to backend
    setIsSaved(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const tabs = [
    { id: "datos-iniciales", label: "Datos Iniciales" },
    { id: "detalles-cientificos", label: "Detalles Científicos" },
    { id: "otros-datos", label: "Otros Datos de Interés" },
    { id: "objetivos-tareas", label: "Objetivos y Tareas" },
    { id: "integrantes", label: "Integrantes" },
    { id: "criterio-consejo", label: "Criterio del Consejo" },
    { id: "produccion-cientifica", label: "Producción Científica" },
  ]

  return (
    <div className="project-form">
      <div className="form-header">
        <h1>{id ? "Editar Proyecto de Investigación" : "Adicionar Proyecto de Investigación"}</h1>
        <p>Complete la información del proyecto</p>
      </div>

      {isSaved && (
        <div className="form-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          {(!isSaved || activeTab === "datos-iniciales") && (
            <div className="form-section">
              <h3>Datos Iniciales</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="nombre">
                    Título del Proyecto <span className="required">*</span>
                  </label>
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Sistema de Reconocimiento Facial"
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
                    placeholder="Describa el proyecto de investigación"
                    rows={4}
                    required
                    className="form-textarea"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="responsableId">
                    Responsable <span className="required">*</span>
                  </label>
                  <Input
                    id="responsableId"
                    name="responsableId"
                    type="text"
                    value={formData.responsableId}
                    onChange={handleChange}
                    placeholder="Buscar responsable del proyecto"
                    required
                  />
                  <small className="form-hint">Busque en el directorio CUJAE</small>
                </div>

                <div className="form-group">
                  <label htmlFor="tematica">
                    Temática <span className="required">*</span>
                  </label>
                  <Input
                    id="tematica"
                    name="tematica"
                    type="text"
                    value={formData.tematica}
                    onChange={handleChange}
                    placeholder="Ej: Inteligencia Artificial"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="programa">
                    Programa <span className="required">*</span>
                  </label>
                  <Input
                    id="programa"
                    name="programa"
                    type="text"
                    value={formData.programa}
                    onChange={handleChange}
                    placeholder="Ej: Programa Nacional de Informatización"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="estado">
                    Estado <span className="required">*</span>
                  </label>
                  <select
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    required
                    className="form-select"
                  >
                    <option value="propuesta">Propuesta</option>
                    <option value="activo">Activo</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="esPriorizado"
                      checked={formData.esPriorizado}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span>Proyecto Priorizado</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="estaAprobado"
                      checked={formData.estaAprobado}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span>Proyecto Aprobado</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {isSaved && activeTab === "detalles-cientificos" && (
            <div className="form-section">
              <h3>Detalles Científicos</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="detallesCientificos">Detalles Científicos</label>
                  <textarea
                    id="detallesCientificos"
                    name="detallesCientificos"
                    value={formData.detallesCientificos}
                    onChange={handleChange}
                    placeholder="Describa los detalles científicos del proyecto"
                    rows={6}
                    className="form-textarea"
                  />
                </div>
              </div>
            </div>
          )}

          {isSaved && activeTab === "otros-datos" && (
            <div className="form-section">
              <h3>Otros Datos de Interés</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="otrosDatos">Otros Datos</label>
                  <textarea
                    id="otrosDatos"
                    name="otrosDatos"
                    value={formData.otrosDatos}
                    onChange={handleChange}
                    placeholder="Información adicional relevante"
                    rows={6}
                    className="form-textarea"
                  />
                </div>
              </div>
            </div>
          )}

          {isSaved && activeTab === "objetivos-tareas" && (
            <div className="form-section">
              <h3>Objetivos y Tareas</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="objetivos">Objetivos</label>
                  <textarea
                    id="objetivos"
                    name="objetivos"
                    value={formData.objetivos}
                    onChange={handleChange}
                    placeholder="Describa los objetivos del proyecto"
                    rows={4}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="tareas">Tareas</label>
                  <textarea
                    id="tareas"
                    name="tareas"
                    value={formData.tareas}
                    onChange={handleChange}
                    placeholder="Describa las tareas principales del proyecto"
                    rows={4}
                    className="form-textarea"
                  />
                </div>
              </div>
            </div>
          )}

          {isSaved && activeTab === "integrantes" && (
            <div className="form-section">
              <h3>Integrantes del Proyecto</h3>
              <div className="section-actions">
                <Button type="button" variant="secondary">
                  Agregar desde Directorio CUJAE
                </Button>
                <Button type="button" variant="secondary">
                  Agregar Externo
                </Button>
              </div>
              <p className="empty-state">No hay integrantes agregados aún</p>
            </div>
          )}

          {isSaved && activeTab === "criterio-consejo" && (
            <div className="form-section">
              <h3>Criterio del Consejo Científico</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="criterioConsejo">Criterio del Consejo</label>
                  <textarea
                    id="criterioConsejo"
                    name="criterioConsejo"
                    value={formData.criterioConsejo}
                    onChange={handleChange}
                    placeholder="Criterio emitido por el consejo científico"
                    rows={6}
                    className="form-textarea"
                  />
                </div>
              </div>
            </div>
          )}

          {isSaved && activeTab === "produccion-cientifica" && (
            <div className="form-section">
              <h3>Producción Científica</h3>
              <div className="section-actions">
                <Button type="button" variant="secondary">
                  Asociar Registro Científico
                </Button>
              </div>
              <p className="empty-state">No hay registros asociados aún</p>
            </div>
          )}

          {!isSaved && (
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate("/projects")}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Proyecto</Button>
            </div>
          )}

          {isSaved && (
            <div className="form-actions">
              <Button type="button" onClick={() => navigate("/projects")}>
                Volver a Proyectos
              </Button>
            </div>
          )}
        </form>
      </Card>

      {!isSaved && (
        <div className="form-info">
          <p>
            <strong>Nota:</strong> Después de guardar el proyecto, podrá acceder a las pestañas adicionales para
            gestionar detalles científicos, integrantes, criterio del consejo y producción científica.
          </p>
        </div>
      )}
    </div>
  )
}
