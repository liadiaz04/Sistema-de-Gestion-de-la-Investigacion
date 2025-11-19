"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Modal } from "../components/common/Modal"
import { OptionsMenu } from "../components/common/OptionsMenu"
import { useAuthStore } from "../stores/authStore"
import { usePermissions } from "../hooks/usePermissions"
import type { IUser } from "../types/index"
import {
  recordMetadataService,
  type FacultyOption,
  type FacultyAreaOption,
  type IntegrantOption,
} from "../services/record/recordMetadataService"
import { groupService } from "../services/groupService"
import "./GroupForm.css"

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

export const GroupEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user: currentUser } = useAuthStore()
  const { isAutor } = usePermissions()

  const isAutorUser = isAutor()
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"datos" | "integrantes">("datos")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [faculties, setFaculties] = useState<FacultyOption[]>([])
  const [facultyAreas, setFacultyAreas] = useState<FacultyAreaOption[]>([])
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null)
  const [selectedFacultyAreaId, setSelectedFacultyAreaId] = useState<number | null>(null)
  const [isMetadataLoading, setIsMetadataLoading] = useState(true)

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
  const [originalCreateDate, setOriginalCreateDate] = useState<string>("")

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

  // Verificar si el usuario actual es responsable y es autor
  const isCurrentUserResponsable = Boolean(isAutorUser && selectedResponsableId && currentUser && 
                                   parseInt(currentUser.id) === selectedResponsableId)

  // Cargar metadata (facultades y áreas)
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setIsMetadataLoading(true)
        const [facultiesData, areasData] = await Promise.all([
          recordMetadataService.getFaculties(),
          recordMetadataService.getFacultyAreas(),
        ])
        setFaculties(facultiesData)
        setFacultyAreas(areasData)
      } catch (error) {
        console.error("Error cargando metadata:", error)
      } finally {
        setIsMetadataLoading(false)
      }
    }

    loadMetadata()
  }, [])

  // Cargar datos del grupo
  useEffect(() => {
    const loadGroupData = async () => {
      if (id) {
        try {
          const group = await groupService.getGroupById(parseInt(id))
          
          setFormData({
            nombre: group.name || "",
            descripcion: group.problems || "",
            facultad: group.faculty?.name || "",
            area: group.faculty_area?.name || "",
            departamento: "",
            tematicas: group.subjects || "",
          })
          
          if (group.leader) {
            setSelectedResponsableId(group.leader.id_integrant)
            setSelectedResponsable({
              id: String(group.leader.id_integrant),
              nombre: group.leader.name.split(" ")[0] || "",
              apellidos: group.leader.name.split(" ").slice(1).join(" ") || "",
              correoElectronico: group.leader.email || "",
              nombreUsuario: "",
              numeroIdentidad: "",
              roles: [],
              esExterno: false,
              esAdministrador: false,
            } as IUser)
          }
          
          setSelectedFacultyId(group.id_faculty)
          setSelectedFacultyAreaId(group.id_faculty_area || null)
          
          // Guardar fecha de creación original
          if (group.create_date) {
            setOriginalCreateDate(group.create_date)
          }
          
          // Cargar miembros
          if (group.members) {
            const memberIds = group.members.map(m => m.id_integrant)
            setSelectedMemberIds(memberIds)
            // Mapear miembros a formato del formulario
            const mappedMembers = group.members.map((m, idx) => ({
              id: `member-${m.id_integrant || idx}`,
              integrantId: m.id_integrant,
              usuario: m.integrant ? {
                id: String(m.integrant.id_integrant),
                nombre: m.integrant.name.split(" ")[0] || "",
                apellidos: m.integrant.name.split(" ").slice(1).join(" ") || "",
                correoElectronico: m.integrant.email || "",
                nombreUsuario: "",
                numeroIdentidad: "",
                roles: [],
                esExterno: false,
                esAdministrador: false,
              } : {
                id: String(m.id_integrant),
                nombre: "",
                apellidos: "",
                correoElectronico: "",
                nombreUsuario: "",
                numeroIdentidad: "",
                roles: [],
                esExterno: false,
                esAdministrador: false,
              },
              rol: "integrante_grupo",
              evaluacion: null,
              descripcionEvaluacion: "",
            }))
            setMembers(mappedMembers)
          }
        } catch (error) {
          console.error("Error cargando grupo:", error)
        }
      }
    }
    
    loadGroupData()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!id || !currentUser) {
      return
    }

    if (!selectedResponsableId || !selectedFacultyId || !selectedFacultyAreaId) {
      setSuccessMessage("Por favor, complete todos los campos requeridos (responsable, facultad y área)")
      setShowSuccessDialog(true)
      return
    }

    try {
      setIsSubmitting(true)

      const now = new Date().toISOString()
      const payload = {
        name: formData.nombre,
        subjects: formData.tematicas || "",
        problems: formData.descripcion || "",
        id_admin: selectedResponsableId,
        id_faculty: selectedFacultyId,
        id_faculty_area: selectedFacultyAreaId,
        create_date: originalCreateDate || now, // Mantener la fecha original
        update_date: now,
        member_ids: selectedMemberIds, // Solo IDs de integrantes CUJAE, no externos
      }

      await groupService.updateGroupWithPayload(parseInt(id), payload)

      setSuccessMessage("Grupo actualizado con éxito")
      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/groups")
      }, 1500)
    } catch (error) {
      console.error("Error actualizando grupo:", error)
      setSuccessMessage("Error al actualizar el grupo")
      setShowSuccessDialog(true)
    } finally {
      setIsSubmitting(false)
    }
  }

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

      <div className="form-header">
        <h1>Editar Grupo de Investigación</h1>
        <p>Modifique la información del grupo</p>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === "datos" ? "active" : ""}`}
          onClick={() => setActiveTab("datos")}
        >
          Datos del Grupo
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === "integrantes" ? "active" : ""}`}
          onClick={() => setActiveTab("integrantes")}
        >
          Integrantes
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          {activeTab === "datos" && (
            <div className="tab-content">
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
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Facultad *</label>
                {isMetadataLoading ? (
                  <Input name="facultad" value="Cargando..." disabled />
                ) : (
                  <select
                    name="facultad"
                    value={selectedFacultyId ?? ""}
                    onChange={(e) => handleFacultyChange(e.target.value)}
                    className="form-select"
                    required
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
                <label>Área *</label>
                {isMetadataLoading ? (
                  <Input name="area" value="Cargando..." disabled />
                ) : (
                  <select
                    name="area"
                    value={selectedFacultyAreaId ?? ""}
                    onChange={(e) => handleFacultyAreaChange(e.target.value)}
                    className="form-select"
                    required
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
                <label>Temáticas</label>
                <Input
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
                      <span>{`${selectedResponsable.nombre} ${selectedResponsable.apellidos}${selectedResponsable.facultad ? ` - ${selectedResponsable.facultad}` : ''}`}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowResponsableModal(true)}
                        disabled={isCurrentUserResponsable}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setShowResponsableModal(true)}
                      disabled={isCurrentUserResponsable}
                    >
                      Seleccionar Responsable
                    </Button>
                  )}
                  {isCurrentUserResponsable && (
                    <p className="form-hint" style={{ color: '#c33', marginTop: '0.5rem' }}>
                      Como autor, no puede cambiar el responsable del grupo
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrantes" && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>Gestión de Integrantes</h2>
                <div className="tab-actions">
                  <Button type="button" variant="secondary" onClick={() => setShowDirectoryModal(true)}>
                    Agregar integrante (Directorio CUJAE)
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowExternalModal(true)}>
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
          )}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/groups")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Modal para seleccionar responsable */}
      <Modal
        isOpen={showResponsableModal}
        onClose={() => {
          setShowResponsableModal(false)
          responsableSearch.setTerm("")
        }}
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

      {/* Modal para agregar integrante desde directorio */}
      <Modal
        isOpen={showDirectoryModal}
        onClose={() => {
          setShowDirectoryModal(false)
          memberSearch.setTerm("")
        }}
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

      {/* Modal para agregar integrante externo */}
      <Modal
        isOpen={showExternalModal}
        onClose={() => {
          setShowExternalModal(false)
          setExternalMember({ nombre: "", apellidos: "", numeroIdentidad: "", entidad: "", email: "" })
        }}
        title="Agregar Integrante Externo"
      >
        <form onSubmit={handleAddExternalMember} className="modal-form">
          <div className="form-group">
            <label>Nombre *</label>
            <Input
              type="text"
              value={externalMember.nombre}
              onChange={(e) => setExternalMember({ ...externalMember, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Apellidos *</label>
            <Input
              type="text"
              value={externalMember.apellidos}
              onChange={(e) => setExternalMember({ ...externalMember, apellidos: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Número de Identidad</label>
            <Input
              type="text"
              value={externalMember.numeroIdentidad}
              onChange={(e) => setExternalMember({ ...externalMember, numeroIdentidad: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Entidad</label>
            <Input
              type="text"
              value={externalMember.entidad}
              onChange={(e) => setExternalMember({ ...externalMember, entidad: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <Input
              type="email"
              value={externalMember.email}
              onChange={(e) => setExternalMember({ ...externalMember, email: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setShowExternalModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal para modificar integrante */}
      {selectedMember && (
        <Modal
          isOpen={showModifyMemberModal}
          onClose={() => {
            setShowModifyMemberModal(false)
            setSelectedMember(null)
          }}
          title="Modificar Integrante"
        >
          <form onSubmit={handleSaveModifiedMember} className="modal-form">
            <div className="form-group">
              <label>Rol</label>
              <select
                className="form-select"
                value={selectedMember.rol}
                onChange={(e) => setSelectedMember({ ...selectedMember, rol: e.target.value })}
              >
                <option value="integrante_grupo">Integrante de Grupo</option>
                <option value="responsable_grupo">Responsable de Grupo</option>
              </select>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setShowModifyMemberModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
