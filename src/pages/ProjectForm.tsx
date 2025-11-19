"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { Input } from "../components/common/Input"
import { Modal } from "../components/common/Modal"
import "./ProjectForm.css"
import { mockProjects, mockRecords } from "../services/mockData"
import { useAuthStore } from "../stores/authStore"
import { usePermissions } from "../hooks/usePermissions"
import type { IUser } from "../types/index"
import {
  recordMetadataService,
  type ProjectTypeOption,
  type ProjectStateOption,
  type ProjectClassificationOption,
  type IntegrantOption,
} from "../services/record/recordMetadataService"
import { projectService } from "../services/projectService"
import { integrantService } from "../services/integrantService"

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

export const ProjectForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { user: currentUser } = useAuthStore()
  const { isAdmin, isAutor } = usePermissions()

  const isAutorUser = isAutor()

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

  const [projectTypes, setProjectTypes] = useState<ProjectTypeOption[]>([])
  const [projectStates, setProjectStates] = useState<ProjectStateOption[]>([])
  const [projectClassifications, setProjectClassifications] = useState<ProjectClassificationOption[]>([])
  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState<number | null>(null)
  const [selectedProjectStateId, setSelectedProjectStateId] = useState<number | null>(null)
  const [selectedProjectClassificationId, setSelectedProjectClassificationId] = useState<number | null>(null)
  const [isMetadataLoading, setIsMetadataLoading] = useState(true)
  const [metadataError, setMetadataError] = useState<string | null>(null)

  const [selectedResponsable, setSelectedResponsable] = useState<IUser | undefined>(undefined)
  const [selectedResponsableId, setSelectedResponsableId] = useState<number | null>(null)
  const [showResponsableModal, setShowResponsableModal] = useState(false)
  const responsableSearch = useIntegrantSearch()
  const [originalInitialDate, setOriginalInitialDate] = useState<string>("")
  
  // Verificar si el usuario actual es responsable y es autor
  const isCurrentUserResponsable = Boolean(isEditMode && isAutorUser && selectedResponsableId && currentUser && 
                                   parseInt(currentUser.id) === selectedResponsableId)

  const [showDirectoryModal, setShowDirectoryModal] = useState(false)
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [externalMembers, setExternalMembers] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [recordSearch, setRecordSearch] = useState("")
  const memberSearch = useIntegrantSearch()
  const [externalMember, setExternalMember] = useState({
    nombre: "",
    apellidos: "",
    numeroIdentidad: "",
    entidad: "",
    email: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    tematica: "",
    programa: "",
    tipoProyecto: "",
    estado: "",
    objetivos: "",
    tareas: "",
    detallesCientificos: "",
    otrosDatos: "",
    criterioConsejo: "",
    palabrasClave: "",
    artState: "",
    problemaCientifico: "",
    objetoEstudio: "",
    campoEstudio: "",
    hipotesis: "",
    objetivoPrincipal: "",
    metodosInvestigacion: "",
    terceroInteresado: "",
    grupoNacional: "",
    grupoInternacional: "",
    publicarRevista: "",
    participarEventos: "",
    codigoCITMA: "",
    codigoMINVEC: "",
    fechaInicio: "",
    fechaFin: "",
    presupuestoEconomico: "",
    necesidadesEconomicas: "",
    presupuestoGeneralCUP: "",
    presupuestoAnualCUP: "",
    is_international: false,
    is_national: false,
    is_territorial: false,
    is_cujae: false,
  })

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setIsMetadataLoading(true)
        setMetadataError(null)
        const [typesResponse, statesResponse, classificationsResponse] = await Promise.all([
          recordMetadataService.getProjectTypes(),
          recordMetadataService.getProjectStates(),
          recordMetadataService.getProjectClassifications(),
        ])
        setProjectTypes(typesResponse)
        setProjectStates(statesResponse)
        setProjectClassifications(classificationsResponse)
      } catch (error) {
        setMetadataError((error as Error).message || "No se pudieron cargar los catálogos")
      } finally {
        setIsMetadataLoading(false)
      }
    }

    loadMetadata()
  }, [])

  useEffect(() => {
    const loadProjectData = async () => {
      if (id && (isViewMode || isEditMode)) {
        try {
          const project = await projectService.getProjectById(parseInt(id))
          
          // Type assertion para acceder a todos los campos del proyecto
          const projectData = project as any
          
          setFormData({
            nombre: project.title || "",
            codigo: project.code || "",
            descripcion: project.description || "",
            tematica: project.thematic || project.classification?.name || "",
            programa: project.national_group || project.international_group || project.type?.name || "",
            tipoProyecto: project.type?.name || "",
            estado: project.state?.name || "propuesta",
            objetivos: project.objectives || "",
            tareas: project.tasks || "",
            detallesCientificos: project.scientific_details || "",
            otrosDatos: project.other_data || "",
            criterioConsejo: project.council_criteria || project.conseil_criteria || "",
            palabrasClave: projectData.keywords || "",
            artState: projectData.art_state || "",
            problemaCientifico: project.cientific_problem || "",
            objetoEstudio: projectData.study_object || "",
            campoEstudio: projectData.study_field || "",
            hipotesis: projectData.hypothesis || "",
            objetivoPrincipal: project.main_objective || "",
            metodosInvestigacion: projectData.research_methods || "",
            terceroInteresado: projectData.interested_third_party || "",
            grupoNacional: project.national_group || "",
            grupoInternacional: project.international_group || "",
            publicarRevista: projectData.publish_magazine || "",
            participarEventos: projectData.participate_events || "",
            codigoCITMA: projectData.citma_code || "",
            codigoMINVEC: projectData.minvec_code || "",
            fechaInicio: project.start_date || project.initial_date || "",
            fechaFin: project.end_date || project.final_date || "",
            presupuestoEconomico: projectData.economic_budget || "",
            necesidadesEconomicas: projectData.economic_needs || "",
            presupuestoGeneralCUP: projectData.general_budget_cup || "",
            presupuestoAnualCUP: projectData.year_budget_cup || "",
            is_international: projectData.is_international || false,
            is_national: projectData.is_national || false,
            is_territorial: projectData.is_territorial || false,
            is_cujae: projectData.is_cujae || false,
          })
          
          if (project.responsible) {
            setSelectedResponsableId(project.responsible.id_integrant)
            setSelectedResponsable({
              id: String(project.responsible.id_integrant),
              nombre: project.responsible.name.split(" ")[0] || "",
              apellidos: project.responsible.name.split(" ").slice(1).join(" ") || "",
              correoElectronico: project.responsible.email || "",
              nombreUsuario: "",
              numeroIdentidad: "",
              roles: [],
              esExterno: false,
              esAdministrador: false,
            } as IUser)
          }
          
          setSelectedProjectTypeId(project.id_type || project.id_project_type || null)
          setSelectedProjectStateId(project.id_state || project.id_project_state || null)
          setSelectedProjectClassificationId(project.id_classification || projectData.id_project_classification || null)
          
          // Guardar fecha de creación original
          if (project.initial_date) {
            setOriginalInitialDate(project.initial_date)
          }
          
          // Cargar miembros
          if (project.members) {
            const memberIds = project.members.map((m) => m.id_integrant)
            setSelectedMemberIds(memberIds)

            const integrantCache = new Map<
              number,
              { id_integrant: number; name: string; email?: string | null; external?: boolean }
            >()

            const resolveMemberIntegrant = async (
              member: (typeof project.members)[number],
            ): Promise<{ id_integrant: number; name: string; email?: string | null; external?: boolean } | null> => {
              if (member.integrant) {
                return {
                  id_integrant: member.integrant.id_integrant,
                  name: member.integrant.name,
                  email: member.integrant.email,
                  external: false,
                }
              }

              if (integrantCache.has(member.id_integrant)) {
                return integrantCache.get(member.id_integrant)!
              }

              try {
                const integrant = await integrantService.getIntegrantById(member.id_integrant)
                const summary = {
                  id_integrant: integrant.id_integrant,
                  name: integrant.name,
                  email: integrant.email,
                  external: integrant.external,
                }
                integrantCache.set(member.id_integrant, summary)
                return summary
              } catch (error) {
                console.error("Error cargando integrante del proyecto:", error)
                integrantCache.set(member.id_integrant, {
                  id_integrant: member.id_integrant,
                  name: "",
                  email: "",
                  external: false,
                })
                return null
              }
            }

            const mappedMembers = await Promise.all(
              project.members.map(async (m, idx) => {
                const integrantInfo = await resolveMemberIntegrant(m)
                const fullName = integrantInfo?.name?.trim() || ""
                const [firstName, ...rest] = fullName.length > 0 ? fullName.split(" ") : ["Integrante", ""]

                return {
                  id: `member-${m.id_project_member || idx}`,
                  integrantId: m.id_integrant,
                  usuario: {
                    id: String(m.id_integrant),
                    nombre: firstName || "Integrante",
                    apellidos: rest.join(" ").trim(),
                    correoElectronico: integrantInfo?.email || "",
                    nombreUsuario: "",
                    numeroIdentidad: "",
                    roles: [],
                    esExterno: integrantInfo?.external ?? false,
                    esAdministrador: false,
                  },
                  rol: m.has_administrative_permission ? "responsable_proyecto" : "integrante_proyecto",
                }
              }),
            )
            setMembers(mappedMembers)
          }
          
          setIsSaved(true)
        } catch (error) {
          console.error("Error cargando proyecto:", error)
          setMetadataError((error as Error).message || "Error al cargar el proyecto")
        }
      }
    }
    
    loadProjectData()
  }, [id, isViewMode, isEditMode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedResponsable) {
      setSuccessMessage("Por favor, seleccione un responsable para el proyecto")
      setShowSuccessDialog(true)
      return
    }

    if (isEditMode && id) {
      const index = mockProjects.findIndex((p) => p.id === id)
      if (index !== -1) {
        mockProjects[index] = {
          ...mockProjects[index],
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tematica: formData.tematica,
          programa: formData.programa,
          tipoProyecto: formData.tipoProyecto, // Save tipoProyecto
          estado: formData.estado as "propuesta" | "activo" | "finalizado" | "cancelado",
          responsable: selectedResponsable, // Save selected responsable
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
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({
        ...formData,
        [name]: checked,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
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
      rol: "integrante_proyecto",
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
      rol: "integrante_proyecto",
    }
    setMembers([...members, newMember])
    setExternalMembers([...externalMembers, newMember])
    setShowExternalModal(false)
    setExternalMember({ nombre: "", apellidos: "", numeroIdentidad: "", entidad: "", email: "" })
    setSuccessMessage("Integrante externo agregado con éxito")
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

  const handleAssociateRecord = (record: any) => {
    if (!records.find((r) => r.id === record.id)) {
      setRecords([...records, record])
      setShowRecordModal(false)
      setSuccessMessage("Registro científico asociado con éxito")
      setShowSuccessDialog(true)
    }
  }

  const handleOpenDirectoryModal = () => {
    setShowDirectoryModal(true)
  }

  // Helper para convertir string vacío a null
  const toNullIfEmpty = (value: string | null | undefined): string | null => {
    return value && value.trim() ? value.trim() : null
  }

  const handleSaveCompleteProject = async () => {
    if (!selectedResponsableId) {
      setSuccessMessage("Por favor, seleccione un responsable para el proyecto")
      setShowSuccessDialog(true)
      return
    }

    try {
      setIsSubmitting(true)

      const now = new Date().toISOString().split("T")[0]
      const initialDate = formData.fechaInicio
        ? new Date(formData.fechaInicio).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
      const finalDate = formData.fechaFin ? new Date(formData.fechaFin).toISOString().split("T")[0] : null

      const payload = {
        title: formData.nombre,
        code: formData.codigo || "",
        keywords: formData.palabrasClave || "",
        member_ids: selectedMemberIds,
        id_responsible: selectedResponsableId,
        thematic: formData.tematica || "",
        id_project_type: selectedProjectTypeId,
        art_state: formData.artState || "",
        cientific_problem: toNullIfEmpty(formData.problemaCientifico),
        study_object: toNullIfEmpty(formData.objetoEstudio),
        study_field: formData.campoEstudio || "",
        hypothesis: formData.hipotesis || "",
        main_objective: toNullIfEmpty(formData.objetivoPrincipal),
        research_methods: formData.metodosInvestigacion || "",
        interested_third_party: toNullIfEmpty(formData.terceroInteresado),
        national_group: formData.grupoNacional || "",
        international_group: toNullIfEmpty(formData.grupoInternacional),
        publish_magazine: toNullIfEmpty(formData.publicarRevista),
        participate_events: toNullIfEmpty(formData.participarEventos),
        citma_code: toNullIfEmpty(formData.codigoCITMA),
        minvec_code: toNullIfEmpty(formData.codigoMINVEC),
        approved: false,
        conseil_criteria: formData.criterioConsejo || "",
        initial_date: initialDate,
        final_date: finalDate,
        update_date: now,
        id_project_state: selectedProjectStateId,
        id_project_classification: selectedProjectClassificationId,
        economic_budget: formData.presupuestoEconomico || "",
        economic_needs: toNullIfEmpty(formData.necesidadesEconomicas),
        id_faculty: null,
        concluded: false,
        approved_date: null,
        general_budget_cup: toNullIfEmpty(formData.presupuestoGeneralCUP),
        year_budget_cup: toNullIfEmpty(formData.presupuestoAnualCUP),
        is_international: formData.is_international,
        is_national: formData.is_national,
        is_territorial: formData.is_territorial,
        is_cujae: formData.is_cujae,
      }

      if (isEditMode && id) {
        // Modo edición: actualizar proyecto existente
        await projectService.updateProjectWithPayload(parseInt(id), payload)
        setSuccessMessage("Proyecto actualizado con éxito")
      } else {
        // Modo creación: crear nuevo proyecto
        await projectService.createProject(payload)
        setSuccessMessage("Proyecto completado y guardado con éxito")
      }

      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/projects")
      }, 1500)
    } catch (error) {
      const errorMessage = (error as Error).message || "Error al guardar el proyecto"
      setSuccessMessage(errorMessage)
      setShowSuccessDialog(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveAllUpdates = async () => {
    if (!id) return

    if (!selectedResponsableId) {
      setSuccessMessage("Por favor, seleccione un responsable para el proyecto")
      setShowSuccessDialog(true)
      return
    }

    try {
      setIsSubmitting(true)

      const now = new Date().toISOString().split("T")[0]
      const initialDate = originalInitialDate || formData.fechaInicio
        ? (originalInitialDate || new Date(formData.fechaInicio).toISOString().split("T")[0])
        : new Date().toISOString().split("T")[0]
      const finalDate = formData.fechaFin ? new Date(formData.fechaFin).toISOString().split("T")[0] : null

      const payload = {
        title: formData.nombre,
        code: formData.codigo || "",
        keywords: formData.palabrasClave || "",
        member_ids: selectedMemberIds,
        id_responsible: selectedResponsableId,
        thematic: formData.tematica || "",
        id_project_type: selectedProjectTypeId,
        art_state: formData.artState || "",
        cientific_problem: toNullIfEmpty(formData.problemaCientifico),
        study_object: toNullIfEmpty(formData.objetoEstudio),
        study_field: formData.campoEstudio || "",
        hypothesis: formData.hipotesis || "",
        main_objective: toNullIfEmpty(formData.objetivoPrincipal),
        research_methods: formData.metodosInvestigacion || "",
        interested_third_party: toNullIfEmpty(formData.terceroInteresado),
        national_group: formData.grupoNacional || "",
        international_group: toNullIfEmpty(formData.grupoInternacional),
        publish_magazine: toNullIfEmpty(formData.publicarRevista),
        participate_events: toNullIfEmpty(formData.participarEventos),
        citma_code: toNullIfEmpty(formData.codigoCITMA),
        minvec_code: toNullIfEmpty(formData.codigoMINVEC),
        approved: false,
        conseil_criteria: formData.criterioConsejo || "",
        initial_date: initialDate,
        final_date: finalDate,
        update_date: now,
        id_project_state: selectedProjectStateId,
        id_project_classification: selectedProjectClassificationId,
        economic_budget: formData.presupuestoEconomico || "",
        economic_needs: toNullIfEmpty(formData.necesidadesEconomicas),
        id_faculty: null,
        concluded: false,
        approved_date: null,
        general_budget_cup: toNullIfEmpty(formData.presupuestoGeneralCUP),
        year_budget_cup: toNullIfEmpty(formData.presupuestoAnualCUP),
        is_international: formData.is_international,
        is_national: formData.is_national,
        is_territorial: formData.is_territorial,
        is_cujae: formData.is_cujae,
      }

      await projectService.updateProjectWithPayload(parseInt(id), payload)

      setSuccessMessage("Proyecto actualizado con éxito")
      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/projects")
      }, 1500)
    } catch (error) {
      console.error("Error actualizando proyecto:", error)
      const errorMessage = (error as Error).message || "Error al actualizar el proyecto"
      setSuccessMessage(errorMessage)
      setShowSuccessDialog(true)
    } finally {
      setIsSubmitting(false)
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
    { id: "presupuesto", label: "Presupuesto" },
    { id: "criterio-consejo", label: "Criterio del Consejo" },
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
        isOpen={showResponsableModal}
        onClose={() => {
          setShowResponsableModal(false)
          responsableSearch.setTerm("")
        }}
        title="Seleccionar Responsable del Proyecto"
      >
        <div className="modal-content">
          <p className="modal-description">Busque y seleccione un integrante del directorio CUJAE como responsable</p>
          <div className="form-group">
            <Input
              placeholder="Buscar por nombre..."
              value={responsableSearch.term}
              onChange={(e) => responsableSearch.setTerm(e.target.value)}
            />
          </div>
          {responsableSearch.isLoading && <p className="loading-state">Buscando...</p>}
          {responsableSearch.error && <p className="error-state">{responsableSearch.error}</p>}
          {!responsableSearch.isLoading && !responsableSearch.error && responsableSearch.results.length === 0 && responsableSearch.term.trim().length >= 2 && (
            <p className="empty-state">No se encontraron integrantes</p>
          )}
          <div className="directory-list">
            {responsableSearch.results.map((integrant) => (
              <div key={integrant.id_integrant} className="directory-item">
                <div className="directory-item-info">
                  <strong>{integrant.name}</strong>
                  {integrant.email && <span>{integrant.email}</span>}
                  {integrant.work_center && <span>{integrant.work_center}</span>}
                </div>
                <Button size="sm" onClick={() => handleSelectResponsableIntegrant(integrant)}>
                  Seleccionar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDirectoryModal}
        onClose={() => {
          setShowDirectoryModal(false)
          memberSearch.setTerm("")
        }}
        title="Agregar Integrante desde Directorio CUJAE"
      >
        <div className="modal-content">
          <p className="modal-description">Busque y seleccione un integrante del directorio CUJAE</p>
          <div className="form-group">
            <Input
              placeholder="Buscar por nombre..."
              value={memberSearch.term}
              onChange={(e) => memberSearch.setTerm(e.target.value)}
            />
          </div>
          {memberSearch.isLoading && <p className="loading-state">Buscando...</p>}
          {memberSearch.error && <p className="error-state">{memberSearch.error}</p>}
          {!memberSearch.isLoading && !memberSearch.error && memberSearch.results.length === 0 && memberSearch.term.trim().length >= 2 && (
            <p className="empty-state">No se encontraron integrantes</p>
          )}
          <div className="directory-list">
            {memberSearch.results.map((integrant) => (
              <div key={integrant.id_integrant} className="directory-item">
                <div className="directory-item-info">
                  <strong>{integrant.name}</strong>
                  {integrant.email && <span>{integrant.email}</span>}
                  {integrant.work_center && <span>{integrant.work_center}</span>}
                </div>
                <Button size="sm" onClick={() => handleSelectMemberIntegrant(integrant)}>
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
          <div className="form-group">
            <label>Email</label>
            <Input
              type="email"
              value={externalMember.email}
              onChange={(e) => setExternalMember({ ...externalMember, email: e.target.value })}
              placeholder="ejemplo@email.com"
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
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="codigo">
                    Código del Proyecto
                  </label>
                  <Input
                    type="text"
                    id="codigo"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleChange}
                    placeholder="Ej: PROJ-2024-001"
                    disabled={isViewMode || isCurrentUserResponsable}
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
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="palabrasClave">
                    Palabras Clave
                  </label>
                  <Input
                    type="text"
                    id="palabrasClave"
                    name="palabrasClave"
                    value={formData.palabrasClave}
                    onChange={handleChange}
                    placeholder="Ej: inteligencia artificial, machine learning, deep learning"
                    disabled={isViewMode || isCurrentUserResponsable}
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
                    disabled={isViewMode || isCurrentUserResponsable}
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
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>

                {isMetadataLoading && (
                  <div className="form-group full-width">
                    <p>Cargando catálogos...</p>
                  </div>
                )}
                {metadataError && (
                  <div className="form-group full-width">
                    <p className="error-state">Error al cargar catálogos: {metadataError}</p>
                  </div>
                )}
                {!isMetadataLoading && !metadataError && (
                  <>
                    <div className="form-group">
                      <label htmlFor="tipoProyecto">
                        Tipo de Proyecto <span className="required">*</span>
                      </label>
                      {isViewMode ? (
                        <Input
                          type="text"
                          id="tipoProyecto"
                          name="tipoProyecto"
                          value={projectTypes.find((t) => t.id_project_type === selectedProjectTypeId)?.name || formData.tipoProyecto}
                          disabled={true}
                        />
                      ) : (
                        <select
                          id="tipoProyecto"
                          name="tipoProyecto"
                          value={selectedProjectTypeId || ""}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : null
                            setSelectedProjectTypeId(value)
                            setFormData({ ...formData, tipoProyecto: projectTypes.find((t) => t.id_project_type === value)?.name || "" })
                          }}
                          required
                          className="form-select"
                          disabled={!!isViewMode}
                        >
                          <option value="">Seleccione un tipo</option>
                          {projectTypes.map((type) => (
                            <option key={type.id_project_type} value={type.id_project_type}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      )}
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
                          value={projectStates.find((s) => s.id_project_state === selectedProjectStateId)?.name || formData.estado}
                          disabled={true}
                        />
                      ) : (
                        <select
                          id="estado"
                          name="estado"
                          value={selectedProjectStateId || ""}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : null
                            setSelectedProjectStateId(value)
                            setFormData({ ...formData, estado: projectStates.find((s) => s.id_project_state === value)?.name || "" })
                          }}
                          required
                          className="form-select"
                          disabled={!!isViewMode}
                        >
                          <option value="">Seleccione un estado</option>
                          {projectStates.map((state) => (
                            <option key={state.id_project_state} value={state.id_project_state}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="clasificacion">
                        Clasificación del Proyecto
                      </label>
                      {isViewMode ? (
                        <Input
                          type="text"
                          id="clasificacion"
                          name="clasificacion"
                          value={projectClassifications.find((c) => c.id_project_classification === selectedProjectClassificationId)?.name || ""}
                          disabled={true}
                        />
                      ) : (
                        <select
                          id="clasificacion"
                          name="clasificacion"
                          value={selectedProjectClassificationId || ""}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : null
                            setSelectedProjectClassificationId(value)
                          }}
                          className="form-select"
                          disabled={!!isViewMode}
                        >
                          <option value="">Seleccione una clasificación</option>
                          {projectClassifications.map((classification) => (
                            <option key={classification.id_project_classification} value={classification.id_project_classification}>
                              {classification.name || classification.code}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </>
                )}

                <div className="form-group full-width">
                  <label>
                    Responsable del Proyecto <span className="required">*</span>
                  </label>
                  {isViewMode ? (
                    <Input
                      type="text"
                      value={
                        selectedResponsable
                          ? `${selectedResponsable.nombre} ${selectedResponsable.apellidos} - ${selectedResponsable.facultad}`
                          : "No asignado"
                      }
                      disabled={true}
                    />
                  ) : (
                    <div className="responsable-selector">
                      {selectedResponsable ? (
                        <div className="selected-responsable">
                          <span>{`${selectedResponsable.nombre} ${selectedResponsable.apellidos}${selectedResponsable.facultad ? ` - ${selectedResponsable.facultad}` : ''}`}</span>
                          {!isEditMode && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setShowResponsableModal(true)}
                            >
                              Cambiar
                            </Button>
                          )}
                        </div>
                      ) : (
                        !isEditMode && (
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => setShowResponsableModal(true)}
                        disabled={isCurrentUserResponsable}
                      >
                        Seleccionar Responsable
                      </Button>
                        )
                      )}
                      {isEditMode && selectedResponsable && (
                        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                          El responsable no puede ser modificado
                        </p>
                      )}
                    </div>
                  )}
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
                  <label htmlFor="artState">Estado del Arte</label>
                  <Input
                    type="text"
                    id="artState"
                    name="artState"
                    value={formData.artState}
                    onChange={handleChange}
                    placeholder="Estado del arte del proyecto"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="problemaCientifico">Problema Científico</label>
                  <textarea
                    id="problemaCientifico"
                    name="problemaCientifico"
                    value={formData.problemaCientifico}
                    onChange={handleChange}
                    placeholder="Describa el problema científico"
                    rows={4}
                    className="form-textarea"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="objetoEstudio">Objeto de Estudio</label>
                  <textarea
                    id="objetoEstudio"
                    name="objetoEstudio"
                    value={formData.objetoEstudio}
                    onChange={handleChange}
                    placeholder="Describa el objeto de estudio"
                    rows={4}
                    className="form-textarea"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="campoEstudio">Campo de Estudio</label>
                  <Input
                    type="text"
                    id="campoEstudio"
                    name="campoEstudio"
                    value={formData.campoEstudio}
                    onChange={handleChange}
                    placeholder="Campo de estudio"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="hipotesis">Hipótesis</label>
                  <Input
                    type="text"
                    id="hipotesis"
                    name="hipotesis"
                    value={formData.hipotesis}
                    onChange={handleChange}
                    placeholder="Hipótesis del proyecto"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="objetivoPrincipal">Objetivo Principal</label>
                  <textarea
                    id="objetivoPrincipal"
                    name="objetivoPrincipal"
                    value={formData.objetivoPrincipal}
                    onChange={handleChange}
                    placeholder="Objetivo principal del proyecto"
                    rows={4}
                    className="form-textarea"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="metodosInvestigacion">Métodos de Investigación</label>
                  <Input
                    type="text"
                    id="metodosInvestigacion"
                    name="metodosInvestigacion"
                    value={formData.metodosInvestigacion}
                    onChange={handleChange}
                    placeholder="Métodos de investigación utilizados"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="terceroInteresado">Tercero Interesado</label>
                  <Input
                    type="text"
                    id="terceroInteresado"
                    name="terceroInteresado"
                    value={formData.terceroInteresado}
                    onChange={handleChange}
                    placeholder="Tercero interesado en el proyecto"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="grupoNacional">Grupo Nacional</label>
                  <Input
                    type="text"
                    id="grupoNacional"
                    name="grupoNacional"
                    value={formData.grupoNacional}
                    onChange={handleChange}
                    placeholder="Grupo nacional"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="grupoInternacional">Grupo Internacional</label>
                  <Input
                    type="text"
                    id="grupoInternacional"
                    name="grupoInternacional"
                    value={formData.grupoInternacional}
                    onChange={handleChange}
                    placeholder="Grupo internacional"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="publicarRevista">Publicar en Revista</label>
                  <Input
                    type="text"
                    id="publicarRevista"
                    name="publicarRevista"
                    value={formData.publicarRevista}
                    onChange={handleChange}
                    placeholder="Revista donde se publicará"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="participarEventos">Participar en Eventos</label>
                  <Input
                    type="text"
                    id="participarEventos"
                    name="participarEventos"
                    value={formData.participarEventos}
                    onChange={handleChange}
                    placeholder="Eventos donde participará"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="codigoCITMA">Código CITMA</label>
                  <Input
                    type="text"
                    id="codigoCITMA"
                    name="codigoCITMA"
                    value={formData.codigoCITMA}
                    onChange={handleChange}
                    placeholder="Código CITMA"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="codigoMINVEC">Código MINVEC</label>
                  <Input
                    type="text"
                    id="codigoMINVEC"
                    name="codigoMINVEC"
                    value={formData.codigoMINVEC}
                    onChange={handleChange}
                    placeholder="Código MINVEC"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fechaInicio">Fecha de Inicio</label>
                  <Input
                    type="date"
                    id="fechaInicio"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleChange}
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fechaFin">Fecha de Fin</label>
                  <Input
                    type="date"
                    id="fechaFin"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleChange}
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Clasificación del Proyecto</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_international"
                        checked={formData.is_international}
                        onChange={handleChange}
                        disabled={!!isViewMode}
                      />
                      <span>Internacional</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_national"
                        checked={formData.is_national}
                        onChange={handleChange}
                        disabled={!!isViewMode}
                      />
                      <span>Nacional</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_territorial"
                        checked={formData.is_territorial}
                        onChange={handleChange}
                        disabled={!!isViewMode}
                      />
                      <span>Territorial</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_cujae"
                        checked={formData.is_cujae}
                        onChange={handleChange}
                        disabled={!!isViewMode}
                      />
                      <span>CUJAE</span>
                    </label>
                  </div>
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
                    disabled={isViewMode || isCurrentUserResponsable}
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
                    disabled={isViewMode || isCurrentUserResponsable}
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
                    disabled={isViewMode || isCurrentUserResponsable}
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

          {(isSaved || isViewMode || isEditMode) && activeTab === "presupuesto" && (
            <div className="form-section">
              <h3>Presupuesto del Proyecto</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="presupuestoEconomico">Presupuesto Económico</label>
                  <Input
                    type="text"
                    id="presupuestoEconomico"
                    name="presupuestoEconomico"
                    value={formData.presupuestoEconomico}
                    onChange={handleChange}
                    placeholder="Presupuesto económico del proyecto"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="necesidadesEconomicas">Necesidades Económicas</label>
                  <textarea
                    id="necesidadesEconomicas"
                    name="necesidadesEconomicas"
                    value={formData.necesidadesEconomicas}
                    onChange={handleChange}
                    placeholder="Describa las necesidades económicas"
                    rows={4}
                    className="form-textarea"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="presupuestoGeneralCUP">Presupuesto General (CUP)</label>
                  <Input
                    type="text"
                    id="presupuestoGeneralCUP"
                    name="presupuestoGeneralCUP"
                    value={formData.presupuestoGeneralCUP}
                    onChange={handleChange}
                    placeholder="Presupuesto general en CUP"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="presupuestoAnualCUP">Presupuesto Anual (CUP)</label>
                  <Input
                    type="text"
                    id="presupuestoAnualCUP"
                    name="presupuestoAnualCUP"
                    value={formData.presupuestoAnualCUP}
                    onChange={handleChange}
                    placeholder="Presupuesto anual en CUP"
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
              </div>
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
                    disabled={isViewMode || isCurrentUserResponsable}
                  />
                </div>
              </div>
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
                  <Button type="button" onClick={handleSaveCompleteProject} disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Proyecto Completo"}
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
              {isAdmin() && (
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

