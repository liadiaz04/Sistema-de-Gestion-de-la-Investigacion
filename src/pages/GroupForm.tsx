"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Modal } from "../components/common/Modal"
import { OptionsMenu } from "../components/common/OptionsMenu"
import "./GroupForm.css"
import { mockUsers, mockRecords, mockGroups } from "../services/mockData"
import { useAuthStore } from "../stores/authStore"
import type { IGroup } from "../types/index"

export const GroupForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const { user: currentUser } = useAuthStore()

  const isViewMode = id && !location.pathname.includes("/edit")
  const isEditMode = id && location.pathname.includes("/edit")
  const isNewMode = !id

  const [isSaved, setIsSaved] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"datos" | "integrantes" | "registros" | "evaluaciones">("datos")

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    facultad: "",
    area: "",
    departamento: "",
    tematicas: "",
  })

  const [members, setMembers] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<Record<string, { evaluacion: string; descripcion: string }>>({})
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const [showModifyMemberModal, setShowModifyMemberModal] = useState(false)
  const [showDirectoryModal, setShowDirectoryModal] = useState(false)
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showSuggestedRecordsModal, setShowSuggestedRecordsModal] = useState(false)

  const [externalMember, setExternalMember] = useState({
    nombre: "",
    apellidos: "",
    numeroIdentidad: "",
    entidad: "",
  })

  const [recordSearch, setRecordSearch] = useState("")
  const [selectedRecordType, setSelectedRecordType] = useState("articulo")

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

  useEffect(() => {
    if (id) {
      const group = mockGroups.find((g) => g.id === id)
      if (group) {
        setFormData({
          nombre: group.nombre,
          descripcion: group.descripcion,
          facultad: group.facultad,
          area: group.area || "",
          departamento: group.departamento || "", 
          tematicas: group.tematicas?.join(",") || "", 
        })
        setIsSaved(true)
      }
    }
  }, [id])

  const handleSaveInitialData = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode && id) {
      const groupIndex = mockGroups.findIndex((g) => g.id === id)
      if (groupIndex !== -1) {
        mockGroups[groupIndex] = {
          ...mockGroups[groupIndex],
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          facultad: formData.facultad,
          area: formData.area,
          departamento: formData.departamento,
          tematicas: formData.tematicas.split(",").map((t) => t.trim()),
          fechaActualizacion: new Date().toISOString(),
        }
        setSuccessMessage("Grupo actualizado con éxito")
        setShowSuccessDialog(true)
        setTimeout(() => {
          navigate("/groups")
        }, 1500)
      }
      return
    }

    // New group mode
    setIsSaved(true)
    setActiveTab("integrantes")
    setSuccessMessage("Datos iniciales guardados")
    setShowSuccessDialog(true)
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
        entidad: externalMember.entidad,
        esExterno: true,
      },
      rol: "integrante_grupo",
      evaluacion: null,
      descripcionEvaluacion: "",
    }
    setMembers([...members, newMember])
    setShowExternalModal(false)
    setExternalMember({ nombre: "", apellidos: "", numeroIdentidad: "", entidad: "" })
    setSuccessMessage("Integrante externo agregado con éxito")
    setShowSuccessDialog(true)
  }

  const handleModifyMember = (member: any) => {
    setSelectedMember(member)
    setShowModifyMemberModal(true)
  }

  const handleSaveModifiedMember = (e: React.FormEvent) => {
    e.preventDefault()
    setMembers(members.map((m) => (m.id === selectedMember.id ? selectedMember : m)))
    setShowModifyMemberModal(false)
    setSelectedMember(null)
    setSuccessMessage("Integrante modificado con éxito")
    setShowSuccessDialog(true)
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId))
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

  const handleSaveAllEvaluations = () => {
    if (!currentUser) {
      setSuccessMessage("Error: Usuario no autenticado")
      return
    }

    const newGroup: IGroup = {
      id: `grupo-${Date.now()}`,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      facultad: formData.facultad,
      area: formData.area,
      departamento: formData.departamento,
      tematicas: formData.tematicas.split(",").map((t) => t.trim()),
      responsable: currentUser,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      totalIntegrantes: members.length,
    }

    mockGroups.push(newGroup)

    setSuccessMessage("Grupo completado y guardado con éxito")
    setShowSuccessDialog(true)
    setTimeout(() => {
      navigate("/groups")
    }, 1500)
  }

  const filteredRecords = mockRecords.filter(
    (r) =>
      r.tipo === selectedRecordType &&
      (r.titulo.toLowerCase().includes(recordSearch.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(recordSearch.toLowerCase())),
  )

  const suggestedRecords = mockRecords.filter((record) => {
    return members.some((member) => record.autores.some((autor) => autor.usuario?.id === member.usuario.id))
  })

  const pageTitle = isViewMode
    ? "Ver Grupo de Investigación"
    : isEditMode
      ? "Editar Grupo de Investigación"
      : "Adicionar Grupo de Investigación"

  return (
    <div className="group-form">
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

      <Modal
        isOpen={showModifyMemberModal}
        onClose={() => setShowModifyMemberModal(false)}
        title="Modificar Integrante"
      >
        {selectedMember && (
          <form onSubmit={handleSaveModifiedMember} className="modal-form">
            <div className="form-group">
              <label>Nombre *</label>
              <Input
                value={selectedMember.usuario.nombre}
                onChange={(e) =>
                  setSelectedMember({
                    ...selectedMember,
                    usuario: { ...selectedMember.usuario, nombre: e.target.value },
                  })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Apellidos *</label>
              <Input
                value={selectedMember.usuario.apellidos}
                onChange={(e) =>
                  setSelectedMember({
                    ...selectedMember,
                    usuario: { ...selectedMember.usuario, apellidos: e.target.value },
                  })
                }
                required
              />
            </div>
            {selectedMember.usuario.esExterno && (
              <div className="form-group">
                <label>Entidad</label>
                <Input
                  value={selectedMember.usuario.entidad || ""}
                  onChange={(e) =>
                    setSelectedMember({
                      ...selectedMember,
                      usuario: { ...selectedMember.usuario, entidad: e.target.value },
                    })
                  }
                />
              </div>
            )}
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setShowModifyMemberModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        )}
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
        <h1>{pageTitle}</h1>
        <p>{isViewMode ? "Detalles del grupo de investigación" : "Complete la información del grupo"}</p>
      </div>

      {isViewMode && (
        <>
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

          {activeTab === "datos" && (
            <Card>
              <div className="tab-content">
                <div className="initial-data-section">
                  <div className="data-header">
                    <h2>Datos Iniciales del Grupo</h2>
                    <p>Información básica del grupo de investigación</p>
                  </div>
                  <div className="data-display">
                    <div className="data-item">
                      <label>Nombre del Grupo</label>
                      <p className="data-value">{formData.nombre}</p>
                    </div>
                    <div className="data-item full-width">
                      <label>Descripción</label>
                      <p className="data-value">{formData.descripcion || "No especificada"}</p>
                    </div>
                    <div className="data-item">
                      <label>Facultad</label>
                      <p className="data-value">{formData.facultad || "No especificada"}</p>
                    </div>
                    <div className="data-item">
                      <label>Área</label>
                      <p className="data-value">{formData.area || "No especificada"}</p>
                    </div>
                    <div className="data-item">
                      <label>Departamento</label>
                      <p className="data-value">{formData.departamento || "No especificado"}</p>
                    </div>
                    <div className="data-item full-width">
                      <label>Temáticas</label>
                      <p className="data-value">{formData.tematicas || "No especificadas"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "integrantes" && (
            <Card>
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Integrantes del Grupo</h2>
                </div>
                <p className="empty-state">No hay integrantes asociados a este grupo.</p>
              </div>
            </Card>
          )}

          {activeTab === "registros" && (
            <Card>
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Registros Científicos</h2>
                </div>
                <p className="empty-state">No hay registros asociados a este grupo.</p>
              </div>
            </Card>
          )}

          {activeTab === "evaluaciones" && (
            <Card>
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Evaluaciones de Integrantes</h2>
                </div>
                <p className="empty-state">No hay evaluaciones registradas.</p>
              </div>
            </Card>
          )}

          <Card>
            <div className="form-actions">
              <Button onClick={() => navigate("/groups")}>Volver a Grupos</Button>
              <Button onClick={() => navigate(`/groups/${id}/edit`)}>Editar Grupo</Button>
            </div>
          </Card>
        </>
      )}

      {isEditMode && (
        <Card>
          <form onSubmit={handleSaveInitialData}>
            <div className="form-group">
              <label>Nombre del Grupo *</label>
              <Input
                name="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Grupo de Investigación en IA"
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describa el enfoque y objetivos del grupo"
                className="form-textarea"
              />
            </div>
            <div className="form-group">
              <label>Facultad</label>
              <Input
                name="facultad"
                value={formData.facultad}
                onChange={(e) => setFormData({ ...formData, facultad: e.target.value })}
                placeholder="Facultad"
              />
            </div>
            <div className="form-group">
              <label>Área</label>
              <Input
                name="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="Área"
              />
            </div>
            <div className="form-group">
              <label>Departamento</label>
              <Input
                name="departamento"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                placeholder="Departamento"
              />
            </div>
            <div className="form-group">
              <label>Temáticas</label>
              <Input
                name="tematicas"
                value={formData.tematicas}
                onChange={(e) => setFormData({ ...formData, tematicas: e.target.value })}
                placeholder="Ej: IA, Machine Learning, NLP"
              />
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate("/groups")}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar Grupo</Button>
            </div>
          </form>
        </Card>
      )}

      {isNewMode && !isSaved && (
        <Card>
          <form onSubmit={handleSaveInitialData}>
            <div className="form-group">
              <label>Nombre del Grupo *</label>
              <Input
                name="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Grupo de Investigación en IA"
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describa el enfoque y objetivos del grupo"
                className="form-textarea"
              />
            </div>
            <div className="form-group">
              <label>Facultad</label>
              <Input
                name="facultad"
                value={formData.facultad}
                onChange={(e) => setFormData({ ...formData, facultad: e.target.value })}
                placeholder="Facultad"
              />
            </div>
            <div className="form-group">
              <label>Área</label>
              <Input
                name="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="Área"
              />
            </div>
            <div className="form-group">
              <label>Departamento</label>
              <Input
                name="departamento"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                placeholder="Departamento"
              />
            </div>
            <div className="form-group">
              <label>Temáticas</label>
              <Input
                name="tematicas"
                value={formData.tematicas}
                onChange={(e) => setFormData({ ...formData, tematicas: e.target.value })}
                placeholder="Ej: IA, Machine Learning, NLP"
              />
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate("/groups")}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Grupo</Button>
            </div>
          </form>
        </Card>
      )}

      {isNewMode && isSaved && (
        <>
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

          {activeTab === "datos" && (
            <Card>
              <div className="tab-content">
                <div className="initial-data-section">
                  <div className="data-header">
                    <h2>Datos Iniciales del Grupo</h2>
                    <p>Información básica del grupo de investigación</p>
                  </div>
                  <div className="data-display">
                    <div className="data-item">
                      <label>Nombre del Grupo</label>
                      <p className="data-value">{formData.nombre}</p>
                    </div>
                    <div className="data-item full-width">
                      <label>Descripción</label>
                      <p className="data-value">{formData.descripcion || "No especificada"}</p>
                    </div>
                    <div className="data-item">
                      <label>Facultad</label>
                      <p className="data-value">{formData.facultad || "No especificada"}</p>
                    </div>
                    <div className="data-item">
                      <label>Área</label>
                      <p className="data-value">{formData.area || "No especificada"}</p>
                    </div>
                    <div className="data-item">
                      <label>Departamento</label>
                      <p className="data-value">{formData.departamento || "No especificado"}</p>
                    </div>
                    <div className="data-item full-width">
                      <label>Temáticas</label>
                      <p className="data-value">{formData.tematicas || "No especificadas"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "integrantes" && (
            <Card>
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Gestión de Integrantes</h2>
                  <div className="tab-actions">
                    <Button variant="secondary" onClick={() => setShowDirectoryModal(true)}>
                      Agregar integrante (Directorio CUJAE)
                    </Button>
                    <Button variant="secondary" onClick={() => setShowExternalModal(true)}>
                      Agregar integrante (Externo de la CUJAE)
                    </Button>
                  </div>
                </div>

                <div className="members-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Tipo</th>
                        <th>Opciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="empty-state">
                            No hay integrantes asociados. Haga clic en "Agregar integrante" para comenzar.
                          </td>
                        </tr>
                      ) : (
                        members.map((member) => (
                          <tr key={member.id}>
                            <td>{`${member.usuario.nombre} ${member.usuario.apellidos}`}</td>
                            <td>{member.rol.replace(/_/g, " ")}</td>
                            <td>{member.usuario.esExterno ? "Externo" : "CUJAE"}</td>
                            <td>
                              <OptionsMenu
                                options={[
                                  {
                                    label: "Ver detalles",
                                    onClick: () => alert(`Ver detalles de ${member.usuario.nombre}`),
                                  },
                                  {
                                    label: "Modificar",
                                    onClick: () => handleModifyMember(member),
                                  },
                                  {
                                    label: "Eliminar integrante",
                                    onClick: () => handleRemoveMember(member.id),
                                  },
                                ]}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "registros" && (
            <Card>
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Registros Científicos Asociados</h2>
                  <div className="tab-actions">
                    <Button variant="secondary" onClick={() => setShowRecordModal(true)}>
                      Asociar registro primario
                    </Button>
                    <Button variant="secondary" onClick={() => setShowSuggestedRecordsModal(true)}>
                      Mostrar registros posibles a asociar
                    </Button>
                  </div>
                </div>

                <div className="records-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Año</th>
                        <th>Opciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="empty-state">
                            No hay registros asociados. Haga clic en "Asociar registro" para comenzar.
                          </td>
                        </tr>
                      ) : (
                        records.map((record) => (
                          <tr key={record.id}>
                            <td>{record.titulo}</td>
                            <td>{record.tipo}</td>
                            <td>{record.año}</td>
                            <td>
                              <OptionsMenu
                                options={[
                                  {
                                    label: "Ver detalles",
                                    onClick: () => alert(`Ver detalles de ${record.titulo}`),
                                  },
                                  {
                                    label: "Desasociar",
                                    onClick: () => handleDisassociateRecord(record.id),
                                  },
                                ]}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "evaluaciones" && (
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
                                />
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {members.length > 0 && (
                  <div className="tab-footer">
                    <Button onClick={handleSaveAllEvaluations}>Guardar Evaluaciones</Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {isNewMode && !isSaved && (
        <div className="form-info">
          <p>
            <strong>Nota:</strong> Después de guardar el grupo, podrá agregar integrantes, asociar registros científicos
            y gestionar evaluaciones.
          </p>
        </div>
      )}
    </div>
  )
}
