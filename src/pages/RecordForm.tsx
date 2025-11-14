"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Modal } from "../components/common/Modal"
import { OptionsMenu } from "../components/common/OptionsMenu"
import type { RecordType } from "../types"
import { mockRecords, mockUsers, mockProjects } from "../services/mockData"
import "./RecordForm.css"
import { useAuthStore } from "../stores/authStore"

export const RecordForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  
  const { user: currentUser } = useAuthStore()
  const isAdmin = currentUser?.roles?.includes("admin") || false

  const isEditMode = id && location.pathname.includes("/edit")
  const isViewMode = id && !location.pathname.includes("/edit")

  const [recordType, setRecordType] = useState<RecordType>("articulo")
  const [isSaved, setIsSaved] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [activeTab, setActiveTab] = useState("datos-basicos")

  const [authors, setAuthors] = useState<any[]>([])
  const [tutors, setTutors] = useState<any[]>([])
  const [associatedProjects, setAssociatedProjects] = useState<any[]>([])
  const [showDirectoryModal, setShowDirectoryModal] = useState(false)
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [modalType, setModalType] = useState<"author" | "tutor">("author")
  const [externalPerson, setExternalPerson] = useState({
    nombre: "",
    apellidos: "",
    numeroIdentidad: "",
    entidad: "",
  })
  const [projectSearch, setProjectSearch] = useState("")

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    año: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    resumen: "",
    palabrasClave: "",
    pais: "Cuba",
    revista: "",
    baseDatos: "",
    issn: "",
    volumen: "",
    numero: "",
    paginas: "",
    doi: "",
    editorial: "",
    isbn: "",
    tipoTesis: "",
    numeroRegistro: "",
    estado: "",
    registroCENDA: "",
    nombreEvento: "",
    organizador: "",
    tipoEvento: "",
    tipoPremio: "",
    institucion: "",
  })

  const recordTypes: { value: RecordType; label: string }[] = [
    { value: "articulo", label: "Artículo" },
    { value: "libro", label: "Libro" },
    { value: "monografia", label: "Monografía" },
    { value: "norma", label: "Norma" },
    { value: "patente", label: "Patente" },
    { value: "software", label: "Software" },
    { value: "evento", label: "Evento" },
    { value: "premio", label: "Premio" },
    { value: "tesis", label: "Tesis" },
  ]

  useEffect(() => {
    if (id) {
      const record = mockRecords.find((r) => r.id === id)
      if (record) {
        setRecordType(record.tipo)
        setFormData({
          titulo: record.titulo,
          descripcion: record.descripcion || "",
          año: record.año,
          mes: record.mes || new Date().getMonth() + 1,
          resumen: record.resumen || "",
          palabrasClave: record.palabrasClave?.join(", ") || "",
          pais: record.pais || "Cuba",
          revista: "",
          baseDatos: "",
          issn: "",
          volumen: "",
          numero: "",
          paginas: "",
          doi: "",
          editorial: "",
          isbn: "",
          tipoTesis: "",
          numeroRegistro: "",
          estado: "",
          registroCENDA: "",
          nombreEvento: "",
          organizador: "",
          tipoEvento: "",
          tipoPremio: "",
          institucion: "",
        })
        setAuthors(record.autores || [])
        setAssociatedProjects([])
        setIsSaved(true)
      }
    }
  }, [id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode && id) {
      const index = mockRecords.findIndex((r) => r.id === id)
      if (index !== -1) {
        mockRecords[index] = {
          ...mockRecords[index],
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          año: formData.año,
          mes: formData.mes,
          tipo: recordType as any,
          resumen: formData.resumen,
          palabrasClave: formData.palabrasClave.split(",").map((k) => k.trim()),
          pais: formData.pais,
        }
        setSuccessMessage("Datos básicos actualizados con éxito")
        setShowSuccessDialog(true)
      }
    } else {
      setIsSaved(true)
      setActiveTab("autores")
      setSuccessMessage("Datos básicos guardados con éxito. Por favor, complete los autores y proyectos asociados.")
      setShowSuccessDialog(true)
    }
  }

  const handleAddFromDirectory = (user: any) => {
    const newPerson = {
      id: `person-${Date.now()}`,
      usuario: user,
      nombre: user.nombre,
      apellidos: user.apellidos,
      esExterno: false,
      esPrincipal: false,
      orden: authors.length + 1,
    }
    if (modalType === "author") {
      setAuthors([...authors, newPerson])
      setSuccessMessage("Autor agregado con éxito")
    } else {
      setTutors([...tutors, newPerson])
      setSuccessMessage("Tutor agregado con éxito")
    }
    setShowDirectoryModal(false)
    setShowSuccessDialog(true)
  }

  const handleAddExternal = (e: React.FormEvent) => {
    e.preventDefault()
    const newPerson = {
      id: `external-${Date.now()}`,
      usuario: {
        id: `external-${Date.now()}`,
        nombre: externalPerson.nombre,
        apellidos: externalPerson.apellidos,
        numeroIdentidad: externalPerson.numeroIdentidad,
        entidad: externalPerson.entidad,
        esExterno: true,
      },
      nombre: externalPerson.nombre,
      apellidos: externalPerson.apellidos,
      esExterno: true,
      esPrincipal: false,
      orden: (modalType === "author" ? authors.length : tutors.length) + 1,
    }
    if (modalType === "author") {
      setAuthors([...authors, newPerson])
      setSuccessMessage("Autor externo agregado con éxito")
    } else {
      setTutors([...tutors, newPerson])
      setSuccessMessage("Tutor externo agregado con éxito")
    }
    setShowExternalModal(false)
    setExternalPerson({ nombre: "", apellidos: "", numeroIdentidad: "", entidad: "" })
    setShowSuccessDialog(true)
  }

  const handleRemoveAuthor = (authorId: string) => {
    setAuthors(authors.filter((a) => a.id !== authorId))
  }

  const handleRemoveTutor = (tutorId: string) => {
    setTutors(tutors.filter((t) => t.id !== tutorId))
  }

  const handleAssociateProject = (project: any) => {
    if (!associatedProjects.find((p) => p.id === project.id)) {
      setAssociatedProjects([...associatedProjects, project])
      setShowProjectModal(false)
      setSuccessMessage("Proyecto asociado con éxito")
      setShowSuccessDialog(true)
    }
  }

  const handleDisassociateProject = (projectId: string) => {
    setAssociatedProjects(associatedProjects.filter((p) => p.id !== projectId))
  }

  const handleSaveCompleteRecord = () => {
    const newRecord = {
      id: `record-${Date.now()}`,
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      tipo: recordType,
      año: formData.año,
      mes: formData.mes,
      resumen: formData.resumen,
      palabrasClave: formData.palabrasClave.split(",").map((k) => k.trim()),
      pais: formData.pais,
      fechaReporte: new Date().toISOString(),
      autores: authors.map((a) => ({
        id: a.id,
        usuario: a.usuario,
        nombre: a.nombre,
        apellidos: a.apellidos,
        esExterno: a.esExterno,
        esPrincipal: a.esPrincipal,
        orden: a.orden,
      })),
      proyectosAsociados: associatedProjects.map((p) => p.id),
    }
    mockRecords.push(newRecord as any)
    setSuccessMessage("Registro científico guardado con éxito")
    setShowSuccessDialog(true)
    setTimeout(() => {
      navigate("/records")
    }, 1500)
  }

  const handleUpdateRecord = () => {
    if (!id) return
    const index = mockRecords.findIndex((r) => r.id === id)
    if (index !== -1) {
      mockRecords[index] = {
        ...mockRecords[index],
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        año: formData.año,
        mes: formData.mes,
        tipo: recordType as any,
        resumen: formData.resumen,
        palabrasClave: formData.palabrasClave.split(",").map((k) => k.trim()),
        pais: formData.pais,
        autores: authors.map((a) => ({
          id: a.id,
          usuario: a.usuario,
          nombre: a.nombre,
          apellidos: a.apellidos,
          esExterno: a.esExterno,
          esPrincipal: a.esPrincipal,
          orden: a.orden,
        })),
      }
      setSuccessMessage("Registro actualizado con éxito")
      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/records")
      }, 1500)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const filteredProjects = mockProjects.filter((p) => p.nombre.toLowerCase().includes(projectSearch.toLowerCase()))

  const renderTypeSpecificFields = () => {
    switch (recordType) {
      case "articulo":
        return (
          <>
            <div className="form-group">
              <label htmlFor="revista">
                Revista <span className="required">*</span>
              </label>
              <Input
                id="revista"
                name="revista"
                type="text"
                value={formData.revista}
                onChange={handleChange}
                placeholder="Nombre de la revista"
                required
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="baseDatos">Base de Datos</label>
              <Input
                id="baseDatos"
                name="baseDatos"
                type="text"
                value={formData.baseDatos}
                onChange={handleChange}
                placeholder="Ej: IEEE Xplore, Scopus"
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="issn">ISSN</label>
              <Input
                id="issn"
                name="issn"
                type="text"
                value={formData.issn}
                onChange={handleChange}
                placeholder="0000-0000"
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="volumen">Volumen</label>
              <Input
                id="volumen"
                name="volumen"
                type="text"
                value={formData.volumen}
                onChange={handleChange}
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="numero">Número</label>
              <Input
                id="numero"
                name="numero"
                type="text"
                value={formData.numero}
                onChange={handleChange}
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="paginas">Páginas</label>
              <Input
                id="paginas"
                name="paginas"
                type="text"
                value={formData.paginas}
                onChange={handleChange}
                placeholder="Ej: 123-145"
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group full-width">
              <label htmlFor="doi">DOI</label>
              <Input
                id="doi"
                name="doi"
                type="text"
                value={formData.doi}
                onChange={handleChange}
                placeholder="10.1000/xyz123"
                disabled={isViewMode ? true : false}
              />
            </div>
          </>
        )
      case "libro":
      case "monografia":
        return (
          <>
            <div className="form-group">
              <label htmlFor="editorial">
                Editorial <span className="required">*</span>
              </label>
              <Input
                id="editorial"
                name="editorial"
                type="text"
                value={formData.editorial}
                onChange={handleChange}
                required
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="isbn">ISBN</label>
              <Input
                id="isbn"
                name="isbn"
                type="text"
                value={formData.isbn}
                onChange={handleChange}
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="paginas">Páginas</label>
              <Input
                id="paginas"
                name="paginas"
                type="text"
                value={formData.paginas}
                onChange={handleChange}
                disabled={isViewMode ? true : false}
              />
            </div>
          </>
        )
      case "tesis":
        return (
          <div className="form-group">
            <label htmlFor="tipoTesis">
              Tipo de Tesis <span className="required">*</span>
            </label>
            {isViewMode ? (
              <Input
                id="tipoTesis"
                name="tipoTesis"
                type="text"
                value={formData.tipoTesis}
                onChange={handleChange}
                disabled={true}
              />
            ) : (
              <select
                id="tipoTesis"
                name="tipoTesis"
                value={formData.tipoTesis}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Seleccione tipo</option>
                <option value="licenciatura">Licenciatura</option>
                <option value="maestria">Maestría</option>
                <option value="doctorado">Doctorado</option>
              </select>
            )}
          </div>
        )
      case "patente":
        return (
          <>
            <div className="form-group">
              <label htmlFor="numeroRegistro">Número de Registro</label>
              <Input
                id="numeroRegistro"
                name="numeroRegistro"
                type="text"
                value={formData.numeroRegistro}
                onChange={handleChange}
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              {isViewMode ? (
                <Input
                  id="estado"
                  name="estado"
                  type="text"
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
                  className="form-select"
                >
                  <option value="">Seleccione estado</option>
                  <option value="tramite">En trámite</option>
                  <option value="concedida">Concedida</option>
                </select>
              )}
            </div>
          </>
        )
      case "software":
        return (
          <>
            <div className="form-group">
              <label htmlFor="registroCENDA">Registro CENDA</label>
              <Input
                id="registroCENDA"
                name="registroCENDA"
                type="text"
                value={formData.registroCENDA}
                onChange={handleChange}
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              {isViewMode ? (
                <Input
                  id="estado"
                  name="estado"
                  type="text"
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
                  className="form-select"
                >
                  <option value="">Seleccione estado</option>
                  <option value="desarrollo">En desarrollo</option>
                  <option value="terminado">Terminado</option>
                  <option value="registrado">Registrado</option>
                </select>
              )}
            </div>
          </>
        )
      case "evento":
        return (
          <>
            <div className="form-group">
              <label htmlFor="nombreEvento">
                Nombre del Evento <span className="required">*</span>
              </label>
              <Input
                id="nombreEvento"
                name="nombreEvento"
                type="text"
                value={formData.nombreEvento}
                onChange={handleChange}
                required
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="organizador">Organizador</label>
              <Input
                id="organizador"
                name="organizador"
                type="text"
                value={formData.organizador}
                onChange={handleChange}
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tipoEvento">Tipo de Evento</label>
              <Input
                id="tipoEvento"
                name="tipoEvento"
                type="text"
                value={formData.tipoEvento}
                onChange={handleChange}
                placeholder="Ej: Congreso, Simposio"
                disabled={isViewMode ? true : false}
              />
            </div>
          </>
        )
      case "premio":
        return (
          <>
            <div className="form-group">
              <label htmlFor="tipoPremio">Tipo de Premio</label>
              <Input
                id="tipoPremio"
                name="tipoPremio"
                type="text"
                value={formData.tipoPremio}
                onChange={handleChange}
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group">
              <label htmlFor="institucion">Institución que Otorga</label>
              <Input
                id="institucion"
                name="institucion"
                type="text"
                value={formData.institucion}
                onChange={handleChange}
                disabled={isViewMode ? true : false}
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  const tabs = [
    { id: "datos-basicos", label: "Datos Básicos" },
    { id: "autores", label: "Autores" },
    ...(recordType === "tesis" ? [{ id: "tutores", label: "Tutores" }] : []),
    { id: "proyectos", label: "Proyectos Asociados" },
  ]

  return (
    <div className="record-form">
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
        title={`Agregar ${modalType === "author" ? "Autor" : "Tutor"} desde Directorio CUJAE`}
      >
        <div className="modal-content">
          <p className="modal-description">Seleccione un usuario del directorio de la CUJAE</p>
          <div className="directory-list">
            {mockUsers.length === 0 ? (
              <p className="empty-state">No hay usuarios disponibles en el directorio</p>
            ) : (
              mockUsers.map((user) => (
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
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showExternalModal}
        onClose={() => setShowExternalModal(false)}
        title={`Agregar ${modalType === "author" ? "Autor" : "Tutor"} Externo`}
      >
        <form onSubmit={handleAddExternal} className="modal-form">
          <div className="form-group">
            <label>Nombre *</label>
            <Input
              value={externalPerson.nombre}
              onChange={(e) => setExternalPerson({ ...externalPerson, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Apellidos *</label>
            <Input
              value={externalPerson.apellidos}
              onChange={(e) => setExternalPerson({ ...externalPerson, apellidos: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Carnet de Identidad *</label>
            <Input
              value={externalPerson.numeroIdentidad}
              onChange={(e) => setExternalPerson({ ...externalPerson, numeroIdentidad: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Entidad a la que pertenece *</label>
            <Input
              value={externalPerson.entidad}
              onChange={(e) => setExternalPerson({ ...externalPerson, entidad: e.target.value })}
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

      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="Asociar Proyecto">
        <div className="modal-content">
          <div className="form-group">
            <Input
              placeholder="Buscar proyecto..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
            />
          </div>
          <div className="record-list">
            {filteredProjects.length === 0 ? (
              <p className="empty-state">No hay proyectos disponibles para asociar</p>
            ) : (
              filteredProjects.map((project) => (
                <div key={project.id} className="record-item">
                  <div className="record-item-info">
                    <strong>{project.nombre}</strong>
                    <span>{project.descripcion}</span>
                    <span>Temática: {project.tematica}</span>
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

      <div className="form-header">
        <h1>
          {isViewMode
            ? "Detalles del Registro Científico"
            : isEditMode
              ? "Editar Registro Científico"
              : "Adicionar Registro Científico"}
        </h1>
        <p>{isViewMode ? "Información del registro" : "Complete la información del registro"}</p>
      </div>

      <div className="record-type-menu">
        {recordTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            className={`type-menu-item ${recordType === type.value ? "selected" : ""}`}
            onClick={() => !isViewMode && !isSaved && setRecordType(type.value)}
            disabled={isViewMode || isSaved ? true : false}
          >
            {type.label}
          </button>
        ))}
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
          {((!isSaved && !isViewMode && !isEditMode) || activeTab === "datos-basicos") && (
            <>
              <div className="form-section">
                <h3>Información General</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="titulo">
                      Título <span className="required">*</span>
                    </label>
                    <Input
                      id="titulo"
                      name="titulo"
                      type="text"
                      value={formData.titulo}
                      onChange={handleChange}
                      placeholder="Título del registro"
                      required
                      disabled={isViewMode ? true : false}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="descripcion">Descripción</label>
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      placeholder="Descripción breve"
                      rows={3}
                      className="form-textarea"
                      disabled={isViewMode ? true : false}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="año">
                      Año <span className="required">*</span>
                    </label>
                    <Input
                      id="año"
                      name="año"
                      type="number"
                      value={formData.año}
                      onChange={handleChange}
                      min="1900"
                      max="2100"
                      required
                      disabled={isViewMode ? true : false}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mes">Mes</label>
                    {isViewMode ? (
                      <Input
                        id="mes"
                        name="mes"
                        type="text"
                        value={formData.mes}
                        onChange={handleChange}
                        disabled={true}
                      />
                    ) : (
                      <select id="mes" name="mes" value={formData.mes} onChange={handleChange} className="form-select">
                        <option value="1">Enero</option>
                        <option value="2">Febrero</option>
                        <option value="3">Marzo</option>
                        <option value="4">Abril</option>
                        <option value="5">Mayo</option>
                        <option value="6">Junio</option>
                        <option value="7">Julio</option>
                        <option value="8">Agosto</option>
                        <option value="9">Septiembre</option>
                        <option value="10">Octubre</option>
                        <option value="11">Noviembre</option>
                        <option value="12">Diciembre</option>
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="pais">País</label>
                    <Input
                      id="pais"
                      name="pais"
                      type="text"
                      value={formData.pais}
                      onChange={handleChange}
                      disabled={isViewMode ? true : false}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Detalles Específicos</h3>
                <div className="form-grid">{renderTypeSpecificFields()}</div>
              </div>

              <div className="form-section">
                <h3>Información Adicional</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="resumen">Resumen</label>
                    <textarea
                      id="resumen"
                      name="resumen"
                      value={formData.resumen}
                      onChange={handleChange}
                      placeholder="Resumen del trabajo"
                      rows={4}
                      className="form-textarea"
                      disabled={isViewMode ? true : false}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="palabrasClave">Palabras Clave</label>
                    <Input
                      id="palabrasClave"
                      name="palabrasClave"
                      type="text"
                      value={formData.palabrasClave}
                      onChange={handleChange}
                      placeholder="Separe las palabras clave con comas"
                      disabled={isViewMode ? true : false}
                    />
                    <small className="form-hint">Separe múltiples palabras clave con comas</small>
                  </div>
                </div>
              </div>

              {!isSaved && !isViewMode && !isEditMode && (
                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={() => navigate("/records")}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Datos Básicos</Button>
                </div>
              )}
            </>
          )}

          {(isSaved || isViewMode || isEditMode) && activeTab === "autores" && (
            <div className="form-section">
              <div className="tab-header">
                <h3>Autores del Registro</h3>
                {!isViewMode && (
                  <div className="tab-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (mockUsers.length === 0) {
                          setSuccessMessage("No hay usuarios disponibles en el directorio")
                          setShowSuccessDialog(true)
                          return
                        }
                        setModalType("author")
                        setShowDirectoryModal(true)
                      }}
                    >
                      Agregar Autor del Directorio CUJAE
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setModalType("author")
                        setShowExternalModal(true)
                      }}
                    >
                      Agregar Autor Externo
                    </Button>
                  </div>
                )}
              </div>
              {authors.length === 0 ? (
                <p className="empty-state">No hay autores agregados aún</p>
              ) : (
                <div className="members-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Apellidos</th>
                        <th>Tipo</th>
                        {!isViewMode && <th>Opciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {authors.map((author) => (
                        <tr key={author.id}>
                          <td>{author.nombre}</td>
                          <td>{author.apellidos}</td>
                          <td>{author.usuario?.esExterno ? "Externo" : "CUJAE"}</td>
                          {!isViewMode && (
                            <td>
                              <OptionsMenu
                                options={[
                                  {
                                    label: "Eliminar",
                                    onClick: () => handleRemoveAuthor(author.id),
                                  },
                                ]}
                              />
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

          {(isSaved || isViewMode || isEditMode) && activeTab === "tutores" && recordType === "tesis" && (
            <div className="form-section">
              <div className="tab-header">
                <h3>Tutores de la Tesis</h3>
                {!isViewMode && (
                  <div className="tab-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (mockUsers.length === 0) {
                          setSuccessMessage("No hay usuarios disponibles en el directorio")
                          setShowSuccessDialog(true)
                          return
                        }
                        setModalType("tutor")
                        setShowDirectoryModal(true)
                      }}
                    >
                      Agregar Tutor del Directorio CUJAE
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setModalType("tutor")
                        setShowExternalModal(true)
                      }}
                    >
                      Agregar Tutor Externo
                    </Button>
                  </div>
                )}
              </div>
              {tutors.length === 0 ? (
                <p className="empty-state">No hay tutores agregados aún</p>
              ) : (
                <div className="members-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Apellidos</th>
                        <th>Tipo</th>
                        {!isViewMode && <th>Opciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {tutors.map((tutor) => (
                        <tr key={tutor.id}>
                          <td>{tutor.nombre}</td>
                          <td>{tutor.apellidos}</td>
                          <td>{tutor.usuario?.esExterno ? "Externo" : "CUJAE"}</td>
                          {!isViewMode && (
                            <td>
                              <OptionsMenu
                                options={[
                                  {
                                    label: "Eliminar",
                                    onClick: () => handleRemoveTutor(tutor.id),
                                  },
                                ]}
                              />
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

          {(isSaved || isViewMode || isEditMode) && activeTab === "proyectos" && (
            <div className="form-section">
              <div className="tab-header">
                <h3>Proyectos de Investigación Asociados</h3>
                {!isViewMode && (
                  <div className="tab-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (mockProjects.length === 0) {
                          setSuccessMessage("No hay proyectos disponibles para asociar")
                          setShowSuccessDialog(true)
                          return
                        }
                        setShowProjectModal(true)
                      }}
                    >
                      Asociar Proyecto de Investigación
                    </Button>
                  </div>
                )}
              </div>
              {associatedProjects.length === 0 ? (
                <p className="empty-state">No hay proyectos asociados aún</p>
              ) : (
                <div className="records-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Temática</th>
                        <th>Fecha Inicio</th>
                        {!isViewMode && <th>Opciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {associatedProjects.map((project) => (
                        <tr key={project.id}>
                          <td>{project.nombre}</td>
                          <td>{project.tematica}</td>
                          <td>{new Date(project.fechaInicio).toLocaleDateString()}</td>
                          {!isViewMode && (
                            <td>
                              <OptionsMenu
                                options={[
                                  {
                                    label: "Desasociar",
                                    onClick: () => handleDisassociateProject(project.id),
                                  },
                                ]}
                              />
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
        </form>
      </Card>

      {isSaved && !isViewMode && !isEditMode && (
        <Card>
          <div className="form-actions">
            <Button type="button" onClick={handleSaveCompleteRecord}>
              Guardar Registro Completo
            </Button>
          </div>
        </Card>
      )}

      {isEditMode && (
        <Card>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/records")}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleUpdateRecord}>
              Actualizar Registro
            </Button>
          </div>
        </Card>
      )}

      {isViewMode && (
        <Card>
          <div className="form-actions">
            <Button type="button" onClick={() => navigate("/records")}>
              Volver a Registros
            </Button>
            {isAdmin && (
              <Button type="button" onClick={() => navigate(`/records/${id}/edit`)}>
                Editar Registro
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
