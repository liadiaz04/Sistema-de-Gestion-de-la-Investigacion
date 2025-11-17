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
import { mockGroups } from "../services/mockData"
import type { IUser } from "../types/index"
import {
  recordMetadataService,
  type FacultyOption,
  type FacultyAreaOption,
  type IntegrantOption,
} from "../services/record/recordMetadataService"
import { groupService } from "../services/groupService"

type IntegrantSearchHook = {
  term: string
  setTerm: (value: string) => void
  results: IntegrantOption[]
  isLoading: boolean
  error: string | null
}

const useIntegrantSearch = (): IntegrantSearchHook => {
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<IntegrantOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const searchValue = term.trim()
    if (searchValue.length < 2) {
      setResults([])
      setError(null)
      setIsLoading(false)
      return () => {
        isMounted = false
      }
    }

    const handler = setTimeout(async () => {
      try {
        setIsLoading(true)
        const data = await recordMetadataService.getIntegrants(searchValue)
        if (isMounted) {
          setResults(data)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(handler)
    }
  }, [term])

  return { term, setTerm, results, isLoading, error }
}

export const GroupForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const isViewMode = id && !location.pathname.includes("/edit")
  const isEditMode = id && location.pathname.includes("/edit")
  const isNewMode = !id

  const [isSaved, setIsSaved] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"datos" | "integrantes" | "evaluaciones">("datos")

  const [faculties, setFaculties] = useState<FacultyOption[]>([])
  const [facultyAreas, setFacultyAreas] = useState<FacultyAreaOption[]>([])
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null)
  const [selectedFacultyAreaId, setSelectedFacultyAreaId] = useState<number | null>(null)
  const [isMetadataLoading, setIsMetadataLoading] = useState(true)
  const [metadataError, setMetadataError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    facultad: "",
    area: "",
    departamento: "",
    tematicas: "",
  })

  const [selectedResponsable, setSelectedResponsable] = useState<IUser | undefined>(undefined)
  const [selectedResponsableId, setSelectedResponsableId] = useState<number | null>(null)
  const [showResponsableModal, setShowResponsableModal] = useState(false)
  const responsableSearch = useIntegrantSearch()

  const [members, setMembers] = useState<any[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [externalMembers, setExternalMembers] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const [showModifyMemberModal, setShowModifyMemberModal] = useState(false)
  const [showDirectoryModal, setShowDirectoryModal] = useState(false)
  const [showExternalModal, setShowExternalModal] = useState(false)
  const memberSearch = useIntegrantSearch()

  const [externalMember, setExternalMember] = useState({
    nombre: "",
    apellidos: "",
    numeroIdentidad: "",
    entidad: "",
    email: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setIsMetadataLoading(true)
        setMetadataError(null)
        const [facultiesResponse, areasResponse] = await Promise.all([
          recordMetadataService.getFaculties(),
          recordMetadataService.getFacultyAreas(),
        ])
        setFaculties(facultiesResponse)
        setFacultyAreas(areasResponse)
      } catch (error) {
        setMetadataError((error as Error).message || "No se pudieron cargar los catálogos")
      } finally {
        setIsMetadataLoading(false)
      }
    }

    loadMetadata()
  }, [])

  useEffect(() => {
    if (id) {
      console.log("[v0] GroupForm - Loading group with id:", id)
      const group = mockGroups.find((g) => g.id === id)
      console.log("[v0] GroupForm - Found group:", group)
      if (group) {
        setFormData({
          nombre: group.nombre || "",
          descripcion: group.descripcion || "",
          facultad: group.facultad || "",
          area: group.area || "",
          departamento: group.departamento || "",
          tematicas: group.tematicas?.join(", ") || "",
        })
        setSelectedResponsable(group.responsable)
        setMembers([])
        setIsSaved(true)
      }
    }
  }, [id])

  // Filtrar áreas por facultad seleccionada
  const filteredFacultyAreas = facultyAreas.filter((area) => area.id_faculty === selectedFacultyId)

  const handleFacultyChange = (facultyId: string) => {
    const id = facultyId ? Number(facultyId) : null
    setSelectedFacultyId(id)
    setSelectedFacultyAreaId(null)
    const faculty = faculties.find((f) => f.id_faculty === id)
    setFormData({ ...formData, facultad: faculty?.name || "", area: "" })
  }

  const handleFacultyAreaChange = (areaId: string) => {
    const id = areaId ? Number(areaId) : null
    setSelectedFacultyAreaId(id)
    const area = facultyAreas.find((a) => a.id_faculty_area === id)
    setFormData({ ...formData, area: area?.name || "" })
  }

  const handleSelectResponsableIntegrant = (integrant: IntegrantOption) => {
    setSelectedResponsableId(integrant.id_integrant)
    setSelectedResponsable({
      id: String(integrant.id_integrant),
      nombre: integrant.name.split(" ")[0] || "",
      apellidos: integrant.name.split(" ").slice(1).join(" ") || "",
      correoElectronico: integrant.email || "",
      nombreUsuario: "",
      numeroIdentidad: "",
      roles: [],
      esExterno: false,
      esAdministrador: false,
    } as IUser)
    setShowResponsableModal(false)
    responsableSearch.setTerm("")
    setSuccessMessage("Responsable seleccionado con éxito")
    setShowSuccessDialog(true)
  }

  const handleSelectMemberIntegrant = (integrant: IntegrantOption) => {
    if (selectedMemberIds.includes(integrant.id_integrant)) {
      setSuccessMessage("Este integrante ya está agregado")
      setShowSuccessDialog(true)
      return
    }
    const newMember = {
      id: `member-${Date.now()}`,
      integrantId: integrant.id_integrant,
      usuario: {
        id: String(integrant.id_integrant),
        nombre: integrant.name.split(" ")[0] || "",
        apellidos: integrant.name.split(" ").slice(1).join(" ") || "",
        correoElectronico: integrant.email || "",
        nombreUsuario: "",
        numeroIdentidad: "",
        roles: [],
        esExterno: false,
        esAdministrador: false,
      },
      rol: "integrante_grupo",
      evaluacion: null,
      descripcionEvaluacion: "",
    }
    setMembers([...members, newMember])
    setSelectedMemberIds([...selectedMemberIds, integrant.id_integrant])
    memberSearch.setTerm("")
    setShowDirectoryModal(false)
    setSuccessMessage("Integrante agregado con éxito")
    setShowSuccessDialog(true)
  }

  const handleSaveInitialData = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedResponsable) {
      setSuccessMessage("Por favor, seleccione un responsable para el grupo")
      setShowSuccessDialog(true)
      return
    }

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
          responsable: selectedResponsable,
          fechaActualizacion: new Date().toISOString(),
        }
        setSuccessMessage("Datos iniciales actualizados con éxito")
        setShowSuccessDialog(true)
      }
      return
    }

    setIsSaved(true)
    setActiveTab("integrantes")
    setSuccessMessage("Datos iniciales guardados")
    setShowSuccessDialog(true)
  }

  const handleAddExternalMember = (e: React.FormEvent) => {
    e.preventDefault()
    const newMember = {
      id: `external-${Date.now()}`,
      integrantId: null,
      usuario: {
        id: `external-${Date.now()}`,
        nombre: externalMember.nombre,
        apellidos: externalMember.apellidos,
        numeroIdentidad: externalMember.numeroIdentidad,
        entidad: externalMember.entidad,
        correoElectronico: externalMember.email,
        esExterno: true,
      },
      rol: "integrante_grupo",
      evaluacion: null,
      descripcionEvaluacion: "",
    }
    setMembers([...members, newMember])
    setExternalMembers([...externalMembers, newMember])
    setShowExternalModal(false)
    setExternalMember({ nombre: "", apellidos: "", numeroIdentidad: "", entidad: "", email: "" })
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
    const memberToRemove = members.find((m) => m.id === memberId)
    setMembers(members.filter((m) => m.id !== memberId))
    if (memberToRemove?.integrantId) {
      setSelectedMemberIds((prev) => prev.filter((id) => id !== memberToRemove.integrantId))
    }
    if (memberToRemove?.usuario?.esExterno) {
      setExternalMembers((prev) => prev.filter((m) => m.id !== memberId))
    }
  }

  const handleSaveAllUpdates = () => {
    if (!id) return

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
        responsable: selectedResponsable,
        fechaActualizacion: new Date().toISOString(),
        totalIntegrantes: members.length,
      }

      setSuccessMessage("Grupo actualizado con éxito")
      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/groups")
      }, 1500)
    }
  }

  const handleSaveCompleteGroup = async () => {
    if (!selectedResponsableId || !selectedFacultyId || !selectedFacultyAreaId) {
      setSuccessMessage("Por favor, complete todos los campos requeridos (responsable, facultad y área)")
      setShowSuccessDialog(true)
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const now = new Date().toISOString()
      const payload = {
        name: formData.nombre,
        subjects: formData.tematicas || "",
        problems: formData.descripcion || "",
        id_admin: selectedResponsableId,
        id_faculty: selectedFacultyId,
        create_date: now,
        update_date: now,
        member_ids: selectedMemberIds,
        id_faculty_area: selectedFacultyAreaId,
      }

      await groupService.createGroup(payload)

      setSuccessMessage("Grupo completado y guardado con éxito")
      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/groups")
      }, 1500)
    } catch (error) {
      const errorMessage = (error as Error).message || "Error al guardar el grupo"
      setSubmitError(errorMessage)
      setSuccessMessage(errorMessage)
      setShowSuccessDialog(true)
    } finally {
      setIsSubmitting(false)
    }
  }

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
        isOpen={showResponsableModal}
        onClose={() => setShowResponsableModal(false)}
        title="Seleccionar Responsable del Grupo"
      >
        <div className="modal-content">
          <div className="form-group">
            <label>Buscar integrante CUJAE</label>
            <Input
              placeholder="Escribe un nombre, correo o centro de trabajo"
              value={responsableSearch.term}
              onChange={(e) => responsableSearch.setTerm(e.target.value)}
              aria-label="Campo para buscar responsable"
            />
            <small className="form-hint">
              Filtramos automáticamente contra el directorio en línea y puedes seleccionar los resultados.
            </small>
          </div>
          <div className="record-list">
            {responsableSearch.isLoading ? (
              <p className="empty-state">Buscando integrantes...</p>
            ) : responsableSearch.error ? (
              <p className="error-message">{responsableSearch.error}</p>
            ) : responsableSearch.results.length === 0 ? (
              <p className="empty-state">Escribe al menos 2 caracteres para obtener coincidencias</p>
            ) : (
              responsableSearch.results.map((integrant) => (
                <div key={integrant.id_integrant} className="record-item">
                  <div className="record-item-info">
                    <strong>{integrant.name}</strong>
                    <span>{integrant.email || "Sin correo"}</span>
                    <span>{integrant.work_center || "Sin centro de trabajo"}</span>
                  </div>
                  <Button
                    size="sm"
                    aria-label={`Seleccionar ${integrant.name} como responsable`}
                    onClick={() => handleSelectResponsableIntegrant(integrant)}
                  >
                    Seleccionar
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDirectoryModal}
        onClose={() => setShowDirectoryModal(false)}
        title="Agregar Integrante desde Directorio CUJAE"
      >
        <div className="modal-content">
          <div className="form-group">
            <label>Buscar integrante CUJAE</label>
            <Input
              placeholder="Escribe un nombre, correo o centro de trabajo"
              value={memberSearch.term}
              onChange={(e) => memberSearch.setTerm(e.target.value)}
              aria-label="Campo para buscar integrantes"
            />
            <small className="form-hint">
              Filtramos automáticamente contra el directorio en línea y puedes seleccionar los resultados.
            </small>
          </div>
          <div className="record-list">
            {memberSearch.isLoading ? (
              <p className="empty-state">Buscando integrantes...</p>
            ) : memberSearch.error ? (
              <p className="error-message">{memberSearch.error}</p>
            ) : memberSearch.results.length === 0 ? (
              <p className="empty-state">Escribe al menos 2 caracteres para obtener coincidencias</p>
            ) : (
              memberSearch.results.map((integrant) => (
                <div key={integrant.id_integrant} className="record-item">
                  <div className="record-item-info">
                    <strong>{integrant.name}</strong>
                    <span>{integrant.email || "Sin correo"}</span>
                    <span>{integrant.work_center || "Sin centro de trabajo"}</span>
                  </div>
                  <Button
                    size="sm"
                    aria-label={`Agregar ${integrant.name} como integrante`}
                    onClick={() => handleSelectMemberIntegrant(integrant)}
                  >
                    Agregar
                  </Button>
                </div>
              ))
            )}
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
          <div className="form-group">
            <label>Correo Electrónico</label>
            <Input
              type="email"
              value={externalMember.email}
              onChange={(e) => setExternalMember({ ...externalMember, email: e.target.value })}
              placeholder="ejemplo@universidad.edu"
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

      <div className="form-header">
        <h1>{pageTitle}</h1>
        <p>{isViewMode ? "Detalles del grupo de investigación" : "Complete la información del grupo"}</p>
      </div>

      {isMetadataLoading && (
        <Card>
          <p>Cargando catálogos iniciales...</p>
        </Card>
      )}

      {metadataError && (
        <Card>
          <p className="error-message">{metadataError}</p>
        </Card>
      )}

      {!isMetadataLoading && !metadataError && !isViewMode && !isEditMode && !isSaved && (
        <>
          <Card>
            <form onSubmit={handleSaveInitialData}>
              <div className="form-section">
                <h3>Datos Iniciales</h3>
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
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Facultad</label>
                  {isMetadataLoading ? (
                    <Input name="facultad" value="Cargando..." disabled />
                  ) : (
                    <select
                      name="facultad"
                      value={selectedFacultyId ?? ""}
                      onChange={(e) => handleFacultyChange(e.target.value)}
                      className="form-select"
                      disabled={faculties.length === 0}
                    >
                      <option value="">Seleccione una facultad</option>
                      {faculties.map((faculty) => (
                        <option key={faculty.id_faculty} value={faculty.id_faculty}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label>Área</label>
                  {isMetadataLoading ? (
                    <Input name="area" value="Cargando..." disabled />
                  ) : (
                    <select
                      name="area"
                      value={selectedFacultyAreaId ?? ""}
                      onChange={(e) => handleFacultyAreaChange(e.target.value)}
                      className="form-select"
                      disabled={!selectedFacultyId || filteredFacultyAreas.length === 0}
                    >
                      <option value="">Seleccione un área</option>
                      {filteredFacultyAreas.map((area) => (
                        <option key={area.id_faculty_area} value={area.id_faculty_area}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  )}
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
                  <label>Temáticas (separadas por comas)</label>
                  <Input
                    name="tematicas"
                    value={formData.tematicas}
                    onChange={(e) => setFormData({ ...formData, tematicas: e.target.value })}
                    placeholder="Ej: IA, Machine Learning, NLP"
                  />
                </div>
                <div className="form-group">
                  <label>Responsable del Grupo *</label>
                  <div className="responsable-selector">
                    {selectedResponsable ? (
                      <div className="selected-responsable">
                        <span>{`${selectedResponsable.nombre} ${selectedResponsable.apellidos} - ${selectedResponsable.facultad}`}</span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowResponsableModal(true)}
                        >
                          Cambiar
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="secondary" onClick={() => setShowResponsableModal(true)}>
                        Seleccionar Responsable
                      </Button>
                    )}
                  </div>
                </div>
                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={() => navigate("/groups")}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Datos Iniciales</Button>
                </div>
              </div>
            </form>
          </Card>

          <div className="form-info">
            <p>
              <strong>Nota:</strong> Después de guardar el grupo, podrá agregar integrantes, asociar registros
              científicos y gestionar evaluaciones.
            </p>
          </div>
        </>
      )}

      {!isViewMode && !isEditMode && isSaved && (
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
            {/* <button
              className={`tab-button ${activeTab === "evaluaciones" ? "active" : ""}`}
              onClick={() => setActiveTab("evaluaciones")}
            >
              Evaluaciones
            </button> */}
          </div>

          {activeTab === "datos" && (
            <Card>
              <div className="initial-data-section">
                <div className="data-header">
                  <h2>Datos Iniciales del Grupo</h2>
                  <p>Información básica guardada</p>
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
                  <div className="data-item">
                    <label>Responsable</label>
                    <p className="data-value">
                      {selectedResponsable
                        ? `${selectedResponsable.nombre} ${selectedResponsable.apellidos}`
                        : "No asignado"}
                    </p>
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
                        {!isNewMode && <th>Opciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={isNewMode ? 3 : 4} className="empty-state">
                            No hay integrantes asociados. Haga clic en "Agregar integrante" para comenzar.
                          </td>
                        </tr>
                      ) : (
                        members.map((member) => (
                          <tr key={member.id}>
                            <td>{`${member.usuario.nombre} ${member.usuario.apellidos}`}</td>
                            <td>{member.rol.replace(/_/g, " ")}</td>
                            <td>{member.usuario.esExterno ? "Externo" : "CUJAE"}</td>
                            {!isNewMode && (
                              <td>
                                <OptionsMenu
                                  options={[
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
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* {activeTab === "evaluaciones" && (
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
              </div>
            </Card>
          )} */}

          <Card>
            <div className="form-actions">
              {submitError && <p className="error-message">{submitError}</p>}
              <Button type="button" onClick={handleSaveCompleteGroup} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Grupo Completo"}
              </Button>
            </div>
          </Card>
        </>
      )}

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
            {/* <button
              className={`tab-button ${activeTab === "evaluaciones" ? "active" : ""}`}
              onClick={() => setActiveTab("evaluaciones")}
            >
              Evaluaciones
            </button> */}
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
                    <div className="data-item">
                      <label>Responsable</label>
                      <p className="data-value">
                        {selectedResponsable
                          ? `${selectedResponsable.nombre} ${selectedResponsable.apellidos}`
                          : "No asignado"}
                      </p>
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
                {members.length === 0 ? (
                  <p className="empty-state">No hay integrantes asociados a este grupo.</p>
                ) : (
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
                        {members.map((member) => (
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
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* {activeTab === "evaluaciones" && (
            <Card>
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Evaluaciones de Integrantes</h2>
                </div>
                {members.length === 0 ? (
                  <p className="empty-state">No hay integrantes para mostrar evaluaciones.</p>
                ) : (
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
                        {members.map((member) => {
                          const evaluation = { evaluacion: "no_evaluado", descripcion: "" }
                          return (
                            <tr key={member.id}>
                              <td>{`${member.usuario.nombre} ${member.usuario.apellidos}`}</td>
                              <td>{evaluation.evaluacion.replace(/_/g, " ")}</td>
                              <td>{evaluation.descripcion || "Sin descripción"}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )} */}

          <Card>
            <div className="form-actions">
              <Button onClick={() => navigate("/groups")}>Volver a Grupos</Button>
              <Button onClick={() => navigate(`/groups/${id}/edit`)}>Editar Grupo</Button>
            </div>
          </Card>
        </>
      )}

      {isEditMode && (
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
            {/* <button
              className={`tab-button ${activeTab === "evaluaciones" ? "active" : ""}`}
              onClick={() => setActiveTab("evaluaciones")}
            >
              Evaluaciones
            </button> */}
          </div>

          {activeTab === "datos" && (
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
                <div className="form-group">
                  <label>Responsable del Grupo *</label>
                  <div className="responsable-selector">
                    {selectedResponsable ? (
                      <div className="selected-responsable">
                        <span>{`${selectedResponsable.nombre} ${selectedResponsable.apellidos} - ${selectedResponsable.facultad}`}</span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowResponsableModal(true)}
                        >
                          Cambiar
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="secondary" onClick={() => setShowResponsableModal(true)}>
                        Seleccionar Responsable
                      </Button>
                    )}
                  </div>
                </div>
              </form>
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

          {/* {activeTab === "evaluaciones" && (
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
              </div>
            </Card>
          )} */}

          <Card>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate("/groups")}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveAllUpdates}>
                Actualizar Grupo
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
