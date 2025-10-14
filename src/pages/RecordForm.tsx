"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import type { RecordType } from "../types"
import "./RecordForm.css"

export const RecordForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [recordType, setRecordType] = useState<RecordType>("articulo")
  const [isSaved, setIsSaved] = useState(false)
  const [activeTab, setActiveTab] = useState("datos-basicos")

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    año: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    resumen: "",
    palabrasClave: "",
    pais: "Cuba",
    // Artículo
    revista: "",
    baseDatos: "",
    issn: "",
    volumen: "",
    numero: "",
    paginas: "",
    doi: "",
    // Libro
    editorial: "",
    isbn: "",
    // Tesis
    tipoTesis: "",
    // Patente
    numeroRegistro: "",
    estado: "",
    // Software
    registroCENDA: "",
    // Evento
    nombreEvento: "",
    organizador: "",
    tipoEvento: "",
    // Premio
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Submitting record form:", { recordType, ...formData })
    // TODO: Connect to backend
    setIsSaved(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

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
              />
            </div>
            <div className="form-group">
              <label htmlFor="volumen">Volumen</label>
              <Input id="volumen" name="volumen" type="text" value={formData.volumen} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="numero">Número</label>
              <Input id="numero" name="numero" type="text" value={formData.numero} onChange={handleChange} />
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
              />
            </div>
            <div className="form-group">
              <label htmlFor="isbn">ISBN</label>
              <Input id="isbn" name="isbn" type="text" value={formData.isbn} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="paginas">Páginas</label>
              <Input id="paginas" name="paginas" type="text" value={formData.paginas} onChange={handleChange} />
            </div>
          </>
        )
      case "tesis":
        return (
          <div className="form-group">
            <label htmlFor="tipoTesis">
              Tipo de Tesis <span className="required">*</span>
            </label>
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
              />
            </div>
            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select id="estado" name="estado" value={formData.estado} onChange={handleChange} className="form-select">
                <option value="">Seleccione estado</option>
                <option value="tramite">En trámite</option>
                <option value="concedida">Concedida</option>
              </select>
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
              />
            </div>
            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select id="estado" name="estado" value={formData.estado} onChange={handleChange} className="form-select">
                <option value="">Seleccione estado</option>
                <option value="desarrollo">En desarrollo</option>
                <option value="terminado">Terminado</option>
                <option value="registrado">Registrado</option>
              </select>
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
      <div className="form-header">
        <h1>{id ? "Editar Registro Científico" : "Adicionar Registro Científico"}</h1>
        <p>Complete la información del registro</p>
      </div>

      <div className="record-type-menu">
        {recordTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            className={`type-menu-item ${recordType === type.value ? "selected" : ""}`}
            onClick={() => setRecordType(type.value)}
          >
            {type.label}
          </button>
        ))}
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
          {(!isSaved || activeTab === "datos-basicos") && (
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
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mes">Mes</label>
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
                  </div>

                  <div className="form-group">
                    <label htmlFor="pais">País</label>
                    <Input id="pais" name="pais" type="text" value={formData.pais} onChange={handleChange} />
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
                    />
                    <small className="form-hint">Separe múltiples palabras clave con comas</small>
                  </div>
                </div>
              </div>
            </>
          )}

          {isSaved && activeTab === "autores" && (
            <div className="form-section">
              <h3>Autores del Registro</h3>
              <div className="section-actions">
                <Button type="button" variant="secondary">
                  Agregar Autor del Directorio CUJAE
                </Button>
                <Button type="button" variant="secondary">
                  Agregar Autor Externo
                </Button>
              </div>
              <p className="empty-state">No hay autores agregados aún</p>
            </div>
          )}

          {isSaved && activeTab === "tutores" && recordType === "tesis" && (
            <div className="form-section">
              <h3>Tutores de la Tesis</h3>
              <div className="section-actions">
                <Button type="button" variant="secondary">
                  Agregar Tutor del Directorio CUJAE
                </Button>
                <Button type="button" variant="secondary">
                  Agregar Tutor Externo
                </Button>
              </div>
              <p className="empty-state">No hay tutores agregados aún</p>
            </div>
          )}

          {isSaved && activeTab === "proyectos" && (
            <div className="form-section">
              <h3>Proyectos de Investigación Asociados</h3>
              <div className="section-actions">
                <Button type="button" variant="secondary">
                  Asociar Proyecto de Investigación
                </Button>
              </div>
              <p className="empty-state">No hay proyectos asociados aún</p>
            </div>
          )}

          {!isSaved && (
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate("/records")}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Registro</Button>
            </div>
          )}

          {isSaved && (
            <div className="form-actions">
              <Button type="button" onClick={() => navigate("/records")}>
                Volver a Registros
              </Button>
            </div>
          )}
        </form>
      </Card>

      {!isSaved && (
        <div className="form-info">
          <p>
            <strong>Nota:</strong> Después de guardar el registro, podrá agregar autores, tutores (para tesis) y asociar
            proyectos de investigación.
          </p>
        </div>
      )}
    </div>
  )
}
