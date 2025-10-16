"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Modal } from "../components/common/Modal"
import "./GroupForm.css"
import { mockUsers, mockProjects, mockRecords } from "../services/mockData"

export const GroupList = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isViewMode = window.location.pathname.includes("/view")
  const [isSaved, setIsSaved] = useState(!!id)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"datos" | "integrantes" | "proyectos" | "registros" | "evaluaciones">(
    "datos",
  )

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    facultad: "",
    departamento: "",
    tematicas: "",
  })

  const [members, setMembers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<Record<string, { evaluacion: string; descripcion: string }>>({})

  const [showDirectoryModal, setShowDirectoryModal] = useState(false)
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showSuggestedProjectsModal, setShowSuggestedProjectsModal] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showSuggestedRecordsModal, setShowSuggestedRecordsModal] = useState(false)

  const [externalMember, setExternalMember] = useState({
    nombre: "",
    apellidos: "",
    numeroIdentidad: "",
  })

  const [projectSearch, setProjectSearch] = useState("")
  const [recordSearch, setRecordSearch] = useState("")
  const [selectedRecordType, setSelectedRecordType] = useState("articulo")

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

  const recordTypes = [
    { value: "articulo", label: "Artículos" },
    { value: "libro", label: "Libros" },
    { value: "tesis", label: "Tesis" },
    { value: "monografia", label: "Monografías" },
    { value: "patente", label: "Patentes" },
    { value: "software", label: "Software" },
    { value: "evento", label: "Eventos" },
    { value: "premio", label: "Premios" },
    { value: "norma", label: "Normas" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage("Grupo guardado con éxito")
    setShowSuccessDialog(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSuccessAccept = () => {
    setShowSuccessDialog(false)
    setIsSaved(true)
    setActiveTab("integrantes")
  }

  const handleAddFromDirectory = (user: any) => {
    const newMember = {
      id: `member-${Date.now()}`,
      usuario: user,
      rol: "integrante_grupo",
      evaluacion: null,
      descripcionEvaluacion: "",
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
        esExterno: true,
      },
      rol: "integrante_grupo",
      evaluacion: null,
      descripcionEvaluacion: "",
    }
    setMembers([...members, newMember])
    setShowExternalModal(false)
    setExternalMember({ nombre: "", apellidos: "", numeroIdentidad: "" })
    setSuccessMessage("Integrante externo agregado con éxito")
    setShowSuccessDialog(true)
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId))
  }

  const handleMemberTabComplete = () => {
    setActiveTab("proyectos")
  }

  const handleAssociateProject = (project: any) => {
    if (!projects.find((p) => p.id === project.id)) {
      setProjects([...projects, project])
      setShowProjectModal(false)
      setShowSuggestedProjectsModal(false)
      setSuccessMessage("Proyecto asociado con éxito")
      setShowSuccessDialog(true)
    }
  }

  const handleDisassociateProject = (projectId: string) => {
    setProjects(projects.filter((p) => p.id !== projectId))
  }

  const handleProjectTabComplete = () => {
    setActiveTab("registros")
  }

  const handleAssociateRecord = (record: any) => {
    if (!records.find((r) => r.id === record.id)) {
      setRecords([...records, record])
      setShowRecordModal(false)
      setShowSuggestedRecordsModal(false)
      setSuccessMessage("Registro asociado con éxito")
      setShowSuccessDialog(true)
    }
  }

  const handleDisassociateRecord = (recordId: string) => {
    setRecords(records.filter((r) => r.id !== recordId))
  }

  const handleRecordTabComplete = () => {
    setActiveTab("evaluaciones")
  }

  const handleSaveAllEvaluations = () => {
    setSuccessMessage("Evaluaciones guardadas con éxito")
    setShowSuccessDialog(true)
  }

  const handleCompleteGroup = () => {
    setSuccessMessage("Grupo completado y guardado con éxito")
    setShowSuccessDialog(true)
    setTimeout(() => {
      navigate("/groups")
    }, 1500)
  }

  const filteredProjects = mockProjects.filter(
    (p) =>
      p.nombre.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(projectSearch.toLowerCase()),
  )

  const filteredRecords = mockRecords.filter(
    (r) =>
      r.tipo === selectedRecordType &&
      (r.titulo.toLowerCase().includes(recordSearch.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(recordSearch.toLowerCase())),
  )

const suggestedProjects = mockProjects.filter((project) => {
    // Suggest projects where any member is involved
    return members.some((member) => project.responsable.id === member.usuario?.id)
})

const suggestedRecords = mockRecords.filter((record) => {
    // Suggest records from associated projects
    return projects.some((project) => record.autores.some((autor) => autor.usuario?.id === project.responsable.id))
})

  return (
    <div className="group-form">
      {showSuccessDialog && (
        <div className="success-dialog-overlay">
          <div className="success-dialog">
            <div className="success-icon">✓</div>
            <h2>{successMessage}</h2>
            {!isSaved && (
              <p>El grupo ha sido creado correctamente. Ahora puede agregar integrantes, proyectos y registros.</p>
            )}
            <Button onClick={handleSuccessAccept}>Aceptar</Button>
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
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowExternalModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="Asociar Proyecto">
        <div className="modal-content">
          <div className="form-group">
            <Input
              placeholder="Buscar proyecto..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
            />
          </div>
          <div className="project-list">
            {filteredProjects.map((project) => (
              <div key={project.id} className="project-item">
                <div className="project-item-info">
                  <strong>{project.nombre}</strong>
                  <span>{project.descripcion}</span>
                  <span>Responsable: {`${project.responsable.nombre} ${project.responsable.apellidos}`}</span>
                </div>
                <Button size="sm" onClick={() => handleAssociateProject(project)}>
                  Asociar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSuggestedProjectsModal}
        onClose={() => setShowSuggestedProjectsModal(false)}
        title="Proyectos Posibles a Asociar"
      >
        <div className="modal-content">
          <p className="modal-description">Proyectos sugeridos basados en los integrantes del grupo</p>
          <div className="project-list">
            {suggestedProjects.length === 0 ? (
              <p className="empty-state">No hay proyectos sugeridos</p>
            ) : (
              suggestedProjects.map((project) => (
                <div key={project.id} className="project-item">
                  <div className="project-item-info">
                    <strong>{project.nombre}</strong>
                    <span>{project.descripcion}</span>
                    <span>Responsable: {`${project.responsable.nombre} ${project.responsable.apellidos}`}</span>
                  </div>
                  <Button size="sm" onClick={() => handleAssociateProject(project)}>
                    Asociar
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRecordModal} onClose={() => setShowRecordModal(false)} title="Asociar Registro">
        <div className="modal-content">
          <div className="form-group">
            <label>Tipo de Registro</label>
            <select
              className="form-select"
              value={selectedRecordType}
              onChange={(e) => setSelectedRecordType(e.target.value)}
            >
              {recordTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <Input
              placeholder="Buscar registro..."
              value={recordSearch}
              onChange={(e) => setRecordSearch(e.target.value)}
            />
          </div>
          <div className="record-list">
            {filteredRecords.map((record) => (
              <div key={record.id} className="record-item">
                <div className="record-item-info">
                  <strong>{record.titulo}</strong>
                  <span>{record.descripcion}</span>
                  <span>Año: {record.año}</span>
                </div>
                <Button size="sm" onClick={() => handleAssociateRecord(record)}>
                  Asociar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSuggestedRecordsModal}
        onClose={() => setShowSuggestedRecordsModal(false)}
        title="Registros Posibles a Asociar"
      >
        <div className="modal-content">
          <p className="modal-description">Registros sugeridos basados en los proyectos asociados</p>
          <div className="record-list">
            {suggestedRecords.length === 0 ? (
              <p className="empty-state">No hay registros sugeridos</p>
            ) : (
              suggestedRecords.map((record) => (
                <div key={record.id} className="record-item">
                  <div className="record-item-info">
                    <strong>{record.titulo}</strong>
                    <span>{record.descripcion}</span>
                    <span>Año: {record.año}</span>
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
            ? "Detalles del Grupo"
            : id
              ? "Editar Grupo de Investigación"
              : "Adicionar Grupo de Investigación"}
        </h1>
        <p>{isViewMode ? "Visualización de información del grupo" : "Complete la información del grupo"}</p>
      </div>

      {isSaved && (
        <div className="form-tabs">
          <button
            className={`tab-button ${activeTab === "datos" ? "active" : ""}`}
            onClick={() => setActiveTab("datos")}
          >
            Datos Iniciales
          </button>
          <button
            className={`tab-button ${activeTab === "integrantes" ? "active" : ""}`}
            onClick={() => setActiveTab("integrantes")}
          >
            Integrantes
          </button>
          <button
            className={`tab-button ${activeTab === "proyectos" ? "active" : ""}`}
            onClick={() => setActiveTab("proyectos")}
          >
            Proyectos
          </button>
          <button
            className={`tab-button ${activeTab === "registros" ? "active" : ""}`}
            onClick={() => setActiveTab("registros")}
          >
            Registros
          </button>
          <button
            className={`tab-button ${activeTab === "evaluaciones" ? "active" : ""}`}
            onClick={() => setActiveTab("evaluaciones")}
          >
            Evaluaciones
          </button>
        </div>
      )}

      {activeTab === "datos" && (
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
                  disabled={isViewMode}
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
                  disabled={isViewMode}
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
                  disabled={isViewMode}
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
                  disabled={isViewMode}
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
                  disabled={isViewMode}
                />
                <small className="form-hint">Separe múltiples temáticas con comas</small>
              </div>
            </div>

            {!isViewMode && (
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => navigate("/groups")}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar Grupo</Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {activeTab === "integrantes" && isSaved && (
        <Card>
          <div className="tab-content">
            <div className="tab-header">
              <h2>Gestión de Integrantes</h2>
              {!isViewMode && (
                <div className="tab-actions">
                  <Button variant="secondary" onClick={() => setShowDirectoryModal(true)}>
                    Agregar integrante (Directorio CUJAE)
                  </Button>
                  <Button variant="secondary" onClick={() => setShowExternalModal(true)}>
                    Agregar integrante (Externo de la CUJAE)
                  </Button>
                </div>
              )}
            </div>

            <div className="members-table">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Tipo</th>
                    {!isViewMode && <th>Opciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={isViewMode ? 3 : 4} className="empty-state">
                        No hay integrantes asociados.{" "}
                        {!isViewMode && 'Haga clic en "Agregar integrante" para comenzar.'}
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id}>
                        <td>{`${member.usuario.nombre} ${member.usuario.apellidos}`}</td>
                        <td>{member.rol.replace(/_/g, " ")}</td>
                        <td>{member.usuario.esExterno ? "Externo" : "CUJAE"}</td>
                        {!isViewMode && (
                          <td>
                            <Button variant="secondary" size="sm" onClick={() => handleRemoveMember(member.id)}>
                              Eliminar
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isViewMode && members.length > 0 && (
              <div className="tab-footer">
                <Button onClick={handleMemberTabComplete}>Continuar a Proyectos</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === "proyectos" && isSaved && (
        <Card>
          <div className="tab-content">
            <div className="tab-header">
              <h2>Proyectos Asociados</h2>
              {!isViewMode && (
                <div className="tab-actions">
                  <Button variant="secondary" onClick={() => setShowProjectModal(true)}>
                    Asociar proyecto de investigación
                  </Button>
                  <Button variant="secondary" onClick={() => setShowSuggestedProjectsModal(true)}>
                    Mostrar proyectos posibles a asociar
                  </Button>
                </div>
              )}
            </div>

            <div className="projects-table">
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Responsable</th>
                    <th>Programa</th>
                    <th>Estado</th>
                    {!isViewMode && <th>Opciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={isViewMode ? 4 : 5} className="empty-state">
                        No hay proyectos asociados. {!isViewMode && 'Haga clic en "Asociar proyecto" para comenzar.'}
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr key={project.id}>
                        <td>{project.nombre}</td>
                        <td>{`${project.responsable.nombre} ${project.responsable.apellidos}`}</td>
                        <td>{project.programa}</td>
                        <td>{project.estado}</td>
                        {!isViewMode && (
                          <td>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDisassociateProject(project.id)}
                            >
                              Desasociar
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isViewMode && projects.length > 0 && (
              <div className="tab-footer">
                <Button onClick={handleProjectTabComplete}>Continuar a Registros</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === "registros" && isSaved && (
        <Card>
          <div className="tab-content">
            <div className="tab-header">
              <h2>Registros Científicos Asociados</h2>
              {!isViewMode && (
                <div className="tab-actions">
                  <Button variant="secondary" onClick={() => setShowRecordModal(true)}>
                    Asociar registro primario
                  </Button>
                  <Button variant="secondary" onClick={() => setShowSuggestedRecordsModal(true)}>
                    Mostrar registros posibles a asociar
                  </Button>
                </div>
              )}
            </div>

            <div className="records-table">
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Año</th>
                    {!isViewMode && <th>Opciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={isViewMode ? 3 : 4} className="empty-state">
                        No hay registros asociados. {!isViewMode && 'Haga clic en "Asociar registro" para comenzar.'}
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr key={record.id}>
                        <td>{record.titulo}</td>
                        <td>{record.tipo}</td>
                        <td>{record.año}</td>
                        {!isViewMode && (
                          <td>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDisassociateRecord(record.id)}
                            >
                              Desasociar
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isViewMode && records.length > 0 && (
              <div className="tab-footer">
                <Button onClick={handleRecordTabComplete}>Continuar a Evaluaciones</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === "evaluaciones" && isSaved && (
        <Card>
          <div className="tab-content">
            <div className="tab-header">
              <h2>Evaluaciones de Integrantes</h2>
              <p>Evalúe el desempeño de los integrantes del grupo</p>
            </div>

            <div className="evaluations-table">
              <table>
                <thead>
                  <tr>
                    <th>Integrante</th>
                    <th>Evaluación</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="empty-state">
                        No hay integrantes para evaluar. Agregue integrantes primero.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => {
                      const evaluation = evaluations[member.id] || { evaluacion: "no_evaluado", descripcion: "" }
                      return (
                        <tr key={member.id}>
                          <td>{`${member.usuario.nombre} ${member.usuario.apellidos}`}</td>
                          <td>
                            <select
                              className="form-select"
                              value={evaluation.evaluacion}
                              onChange={(e) =>
                                setEvaluations({
                                  ...evaluations,
                                  [member.id]: { ...evaluation, evaluacion: e.target.value },
                                })
                              }
                              disabled={isViewMode}
                            >
                              <option value="no_evaluado">No evaluado</option>
                              <option value="mal">Mal</option>
                              <option value="regular">Regular</option>
                              <option value="bien">Bien</option>
                              <option value="excelente">Excelente</option>
                            </select>
                          </td>
                          <td>
                            <Input
                              type="text"
                              placeholder="Descripción de la evaluación"
                              value={evaluation.descripcion}
                              onChange={(e) =>
                                setEvaluations({
                                  ...evaluations,
                                  [member.id]: { ...evaluation, descripcion: e.target.value },
                                })
                              }
                              disabled={isViewMode}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!isViewMode && members.length > 0 && (
              <div className="tab-footer">
                <Button onClick={handleSaveAllEvaluations}>Guardar Evaluaciones</Button>
                <Button onClick={handleCompleteGroup} variant="secondary">
                  Completar y Guardar Grupo
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {!isSaved && (
        <div className="form-info">
          <p>
            <strong>Nota:</strong> Después de guardar el grupo, podrá agregar integrantes, asociar proyectos y registros
            científicos, y gestionar evaluaciones.
          </p>
        </div>
      )}
    </div>
  )
}
