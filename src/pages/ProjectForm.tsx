"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Modal } from "../components/common/Modal"
import "./ProjectForm.css"
import { mockProjects, mockUsers, mockRecords } from "../services/mockData"
import { useAuthStore } from "../stores/authStore"

export const ProjectForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { user: currentUser } = useAuthStore()

  const isAdmin = currentUser?.roles?.includes("admin") || false

  console.log("[v0] ProjectForm - id:", id)
  console.log("[v0] ProjectForm - location.pathname:", location.pathname)

  const isViewMode = id && !location.pathname.includes("/edit")
  const isEditMode = id && location.pathname.includes("/edit")

  console.log("[v0] ProjectForm - isViewMode:", isViewMode)
  console.log("[v0] ProjectForm - isEditMode:", isEditMode)

  const [isSaved, setIsSaved] = useState(false)
  const [activeTab, setActiveTab] = useState("datos-iniciales")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [showDirectoryModal, setShowDirectoryModal] = useState(false)
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [recordSearch, setRecordSearch] = useState("")
  const [externalMember, setExternalMember] = useState({
    nombre: "",
    apellidos: "",
    numeroIdentidad: "",
    entidad: "",
  })

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tematica: "",
    programa: "",
    esPriorizado: false,
    estado: "propuesta" as "propuesta" | "activo" | "finalizado" | "cancelado",
    objetivos: "",
    tareas: "",
    detallesCientificos: "",
    otrosDatos: "",
    criterioConsejo: "",
  })

  useEffect(() => {
    console.log("[v0] ProjectForm - useEffect running, id:", id)
    if (id) {
      const project = mockProjects.find((p) => p.id === id)
      console.log("[v0] ProjectForm - Found project:", project)
      if (project) {
        setFormData({
          nombre: project.nombre,
          descripcion: project.descripcion,
          tematica: project.tematica,
          programa: project.programa,
          esPriorizado: project.esPriorizado,
          estado: project.estado,
          objetivos: project.objetivos || "",
          tareas: project.tareas || "",
          detallesCientificos: project.detallesCientificos || "",
          otrosDatos: project.otrosDatos || "",
          criterioConsejo: project.criterioConsejo || "",
        })
        setIsSaved(true)
        console.log("[v0] ProjectForm - Data loaded, isSaved set to true")
      }
    }
  }, [id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode && id) {
      const index = mockProjects.findIndex((p) => p.id === id)
      if (index !== -1) {
        mockProjects[index] = {
          ...mockProjects[index],
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tematica: formData.tematica,
          programa: formData.programa,
          esPriorizado: formData.esPriorizado,
          estado: formData.estado,
        }
      }
      setSuccessMessage("Datos iniciales actualizados con éxito")
      setShowSuccessDialog(true)
      return
    }

    setIsSaved(true)
    setSuccessMessage("Datos iniciales guardados. Por favor, complete los demás campos del proyecto.")
    setShowSuccessDialog(true)
    setActiveTab("detalles-cientificos")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleAddFromDirectory = (user: any) => {
    const newMember = {
      id: `member-${Date.now()}`,
      usuario: user,
      rol: "integrante_proyecto",
    }
    setMembers([...members, newMember])
    setShowDirectoryModal(false)
    setSuccessMessage("Integrante agregado con éxito")
    setShowSuccessDialog(true)
  }

  const handleAddExternalMember = (e: React.FormEvent) => {
    e.preventDefault()
    const newMember = {
      id: `member-${Date.now()}`,
      usuario: {
        id: `external-${Date.now()}`,
        nombre: externalMember.nombre,
        apellidos: externalMember.apellidos,
        numeroIdentidad: externalMember.numeroIdentidad,
        entidad: externalMember.entidad,
        esExterno: true,
      },
      rol: "integrante_proyecto",
    }
    setMembers([...members, newMember])
    setShowExternalModal(false)
    setExternalMember({ nombre: "", apellidos: "", numeroIdentidad: "", entidad: "" })
    setSuccessMessage("Integrante externo agregado con éxito")
    setShowSuccessDialog(true)
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId))
  }

  const handleAssociateRecord = (record: any) => {
    if (!records.find((r) => r.id === record.id)) {
      setRecords([...records, record])
      setShowRecordModal(false)
      setSuccessMessage("Registro científico asociado con éxito")
      setShowSuccessDialog(true)
    }
  }

  const handleDisassociateRecord = (recordId: string) => {
    setRecords(records.filter((r) => r.id !== recordId))
  }

  const handleOpenRecordModal = () => {
    if (mockRecords.length === 0) {
      setSuccessMessage("No hay registros científicos disponibles para asociar")
      setShowSuccessDialog(true)
      return
    }
    setShowRecordModal(true)
  }

  const handleOpenDirectoryModal = () => {
    if (mockUsers.length === 0) {
      setSuccessMessage("No hay usuarios disponibles en el directorio")
      setShowSuccessDialog(true)
      return
    }
    setShowDirectoryModal(true)
  }

  const handleSaveCompleteProject = () => {
    const newProject = {
      id: `project-${Date.now()}`,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      responsable: currentUser || mockUsers[0],
      tematica: formData.tematica,
      programa: formData.programa,
      esPriorizado: formData.esPriorizado,
      estaAprobado: false,
      estado: formData.estado,
      fechaInicio: new Date().toISOString(),
      objetivos: formData.objetivos,
      tareas: formData.tareas,
      detallesCientificos: formData.detallesCientificos,
      otrosDatos: formData.otrosDatos,
      criterioConsejo: formData.criterioConsejo,
    }

    mockProjects.push(newProject as any)

    setSuccessMessage("Proyecto completado y guardado con éxito")
    setShowSuccessDialog(true)
    setTimeout(() => {
      navigate("/projects")
    }, 1500)
  }

  const handleSaveAllUpdates = () => {
    if (!id) return

    const projectIndex = mockProjects.findIndex((p) => p.id === id)
    if (projectIndex !== -1) {
      mockProjects[projectIndex] = {
        ...mockProjects[projectIndex],
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tematica: formData.tematica,
        programa: formData.programa,
        esPriorizado: formData.esPriorizado,
        estado: formData.estado,
        objetivos: formData.objetivos,
        tareas: formData.tareas,
        detallesCientificos: formData.detallesCientificos,
        otrosDatos: formData.otrosDatos,
        criterioConsejo: formData.criterioConsejo,
      }

      setSuccessMessage("Proyecto actualizado con éxito")
      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/projects")
      }, 1500)
    }
  }

  const filteredRecords = mockRecords.filter(
    (r) =>
      r.titulo.toLowerCase().includes(recordSearch.toLowerCase()) ||
      r.descripcion.toLowerCase().includes(recordSearch.toLowerCase()),
  )

  const tabs = [
    { id: "datos-iniciales", label: "Datos Iniciales" },
    { id: "detalles-cientificos", label: "Detalles Científicos" },
    { id: "otros-datos", label: "Otros Datos de Interés" },
    { id: "objetivos-tareas", label: "Objetivos y Tareas" },
    { id: "integrantes", label: "Integrantes" },
    { id: "criterio-consejo", label: "Criterio del Consejo" },
    { id: "produccion-cientifica", label: "Producción Científica" },
  ]

  console.log(
    "[v0] ProjectForm - About to render, isSaved:",
    isSaved,
    "isEditMode:",
    isEditMode,
    "isViewMode:",
    isViewMode,
  )

  return (
    <div className="project-form">
      {showSuccessDialog && (
        <div className="success-dialog-overlay">
          <div className="success-dialog">
            <div className="success-icon">✓</div>
            <h2>{successMessage}</h2>
            <Button onClick={() => setShowSuccessDialog(false)}>Aceptar</Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDirectoryModal}
        onClose={() => setShowDirectoryModal(false)}
        title="Agregar desde Directorio CUJAE"
      >
        <div className="modal-content">
          <p className="modal-description">Seleccione un usuario del directorio de la CUJAE</p>
          <div className="directory-list">
            {mockUsers.map((user) => (
              <div key={user.id} className="directory-item">
                <div className="directory-item-info">
                  <strong>{`${user.nombre} ${user.apellidos}`}</strong>
                  <span>{user.facultad}</span>
                  <span>{user.correoElectronico}</span>
                </div>
                <Button size="sm" onClick={() => handleAddFromDirectory(user)}>
                  Agregar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={showExternalModal} onClose={() => setShowExternalModal(false)} title="Agregar Integrante Externo">
        <form onSubmit={handleAddExternalMember} className="modal-form">
          <div className="form-group">
            <label>Nombre *</label>
            <Input
              value={externalMember.nombre}
              onChange={(e) => setExternalMember({ ...externalMember, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Apellidos *</label>
            <Input
              value={externalMember.apellidos}
              onChange={(e) => setExternalMember({ ...externalMember, apellidos: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Carnet de Identidad *</label>
            <Input
              value={externalMember.numeroIdentidad}
              onChange={(e) => setExternalMember({ ...externalMember, numeroIdentidad: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Entidad a la que pertenece *</label>
            <Input
              value={externalMember.entidad}
              onChange={(e) => setExternalMember({ ...externalMember, entidad: e.target.value })}
              placeholder="Ej: Universidad de La Habana"
              required
            />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowExternalModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showRecordModal} onClose={() => setShowRecordModal(false)} title="Asociar Registro Científico">
        <div className="modal-content">
          <div className="form-group">
            <Input
              placeholder="Buscar registro por título o descripción..."
              value={recordSearch}
              onChange={(e) => setRecordSearch(e.target.value)}
            />
          </div>
          <div className="record-list">
            {filteredRecords.length === 0 ? (
              <p className="empty-state">No se encontraron registros</p>
            ) : (
              filteredRecords.map((record) => (
                <div key={record.id} className="record-item">
                  <div className="record-item-info">
                    <strong>{record.titulo}</strong>
                    <span>{record.descripcion}</span>
                    <span>
                      Año: {record.año} | Tipo: {record.tipo}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => handleAssociateRecord(record)}>
                    Asociar
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <div className="form-header">
        <h1>
          {isViewMode
            ? "Detalles del Proyecto"
            : isEditMode
              ? "Editar Proyecto de Investigación"
              : "Adicionar Proyecto de Investigación"}
        </h1>
        <p>{isViewMode ? "Información del proyecto" : "Complete la información del proyecto"}</p>
      </div>

      {(isSaved || isViewMode || isEditMode) && (
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
          {((!isSaved && !isViewMode && !isEditMode) || activeTab === "datos-iniciales") && (
            <div className="form-section">
              <h3>Datos Iniciales</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="nombre">
                    Título del Proyecto <span className="required">*</span>
                  </label>
                  <Input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Sistema de Reconocimiento Facial"
                    required
                    disabled={isViewMode ? true : false}
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
                    rows={4}
                    required
                    className="form-textarea"
                    disabled={isViewMode ? true : false}
                  />
                </div>

                {/* <div className="form-group full-width">
                  <label htmlFor="responsable">
                    Responsable <span className="required">*</span>
                  </label>
                  <Input
                    type="text"
                    id="responsable"
                    name="responsable"
                    value="Usuario Actual"
                    placeholder="Buscar responsable del proyecto"
                    required
                    disabled={true}
                  />
                  <small className="form-hint">El responsable es el usuario actual</small>
                </div> */}

                <div className="form-group">
                  <label htmlFor="tematica">
                    Temática <span className="required">*</span>
                  </label>
                  <Input
                    type="text"
                    id="tematica"
                    name="tematica"
                    value={formData.tematica}
                    onChange={handleChange}
                    placeholder="Ej: Inteligencia Artificial"
                    required
                    disabled={isViewMode ? true : false}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="programa">
                    Programa <span className="required">*</span>
                  </label>
                  <Input
                    type="text"
                    id="programa"
                    name="programa"
                    value={formData.programa}
                    onChange={handleChange}
                    placeholder="Ej: Programa Nacional de Informatización"
                    required
                    disabled={isViewMode ? true : false}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="estado">
                    Estado <span className="required">*</span>
                  </label>
                  {isViewMode ? (
                    <Input
                      type="text"
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      disabled={true}
                    />
                  ) : (
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
                  )}
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="esPriorizado"
                      checked={formData.esPriorizado}
                      onChange={handleChange}
                      className="form-checkbox"
                      disabled={isViewMode ? true : false}
                    />
                    <span>Proyecto Priorizado</span>
                  </label>
                </div>
              </div>

              {!isSaved && !isEditMode && !isViewMode && (
                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={() => navigate("/projects")}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Datos Iniciales</Button>
                </div>
              )}
            </div>
          )}

          {(isSaved || isViewMode || isEditMode) && activeTab === "detalles-cientificos" && (
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
                    disabled={isViewMode ? true : false}
                  />
                </div>
              </div>
            </div>
          )}

          {(isSaved || isViewMode || isEditMode) && activeTab === "otros-datos" && (
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
                    disabled={isViewMode ? true : false}
                  />
                </div>
              </div>
            </div>
          )}

          {(isSaved || isViewMode || isEditMode) && activeTab === "objetivos-tareas" && (
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
                    disabled={isViewMode ? true : false}
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
                    disabled={isViewMode ? true : false}
                  />
                </div>
              </div>
            </div>
          )}

          {(isSaved || isViewMode || isEditMode) && activeTab === "integrantes" && (
            <div className="form-section">
              <h3>Integrantes del Proyecto</h3>
              {!isViewMode && (
                <div className="section-actions">
                  <Button type="button" variant="secondary" onClick={handleOpenDirectoryModal}>
                    Agregar desde Directorio CUJAE
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowExternalModal(true)}>
                    Agregar Externo
                  </Button>
                </div>
              )}
              {members.length === 0 ? (
                <p className="empty-state">No hay integrantes agregados aún</p>
              ) : (
                <div className="members-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        {!isViewMode && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td>{`${member.usuario.nombre} ${member.usuario.apellidos}`}</td>
                          <td>{member.usuario.esExterno ? "Externo" : "CUJAE"}</td>
                          {!isViewMode && (
                            <td>
                              <Button size="sm" variant="secondary" onClick={() => handleRemoveMember(member.id)}>
                                Eliminar
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {(isSaved || isViewMode || isEditMode) && activeTab === "criterio-consejo" && (
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
                    disabled={isViewMode ? true : false}
                  />
                </div>
              </div>
            </div>
          )}

          {(isSaved || isViewMode || isEditMode) && activeTab === "produccion-cientifica" && (
            <div className="form-section">
              <h3>Producción Científica</h3>
              {!isViewMode && (
                <div className="section-actions">
                  <Button type="button" variant="secondary" onClick={handleOpenRecordModal}>
                    Asociar Registro Científico
                  </Button>
                </div>
              )}
              {records.length === 0 ? (
                <p className="empty-state">No hay registros asociados aún</p>
              ) : (
                <div className="records-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Año</th>
                        {!isViewMode && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td>{record.titulo}</td>
                          <td>{record.tipo}</td>
                          <td>{record.año}</td>
                          {!isViewMode && (
                            <td>
                              <Button size="sm" variant="secondary" onClick={() => handleDisassociateRecord(record.id)}>
                                Desasociar
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!isViewMode && (isSaved || isEditMode) && (
            <Card>
              <div className="form-actions">
                {isEditMode ? (
                  <>
                    <Button type="button" variant="secondary" onClick={() => navigate("/projects")}>
                      Cancelar
                    </Button>
                    <Button type="button" onClick={handleSaveAllUpdates}>
                      Actualizar Proyecto
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={handleSaveCompleteProject}>
                    Guardar Proyecto Completo
                  </Button>
                )}
              </div>
            </Card>
          )}

          {isViewMode && (
            <div className="form-actions">
              <Button type="button" onClick={() => navigate("/projects")}>
                Volver a Proyectos
              </Button>
              {isAdmin && (
                <Button type="button" variant="secondary" onClick={() => navigate(`/projects/${id}/edit`)}>
                  Editar Proyecto
                </Button>
              )}
            </div>
          )}
        </form>
      </Card>

      {!isSaved && !isViewMode && !isEditMode && (
        <div className="form-info">
          <p>
            <strong>Nota:</strong> Después de guardar los datos iniciales, podrá acceder a las pestañas adicionales para
            gestionar detalles científicos, integrantes, criterio del consejo y producción científica.
          </p>
        </div>
      )}
    </div>
  )
}
