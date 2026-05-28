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
import "./RecordForm.css"
import { groupService } from "../services/groupService"
import { projectService } from "../services/projectService"
import { useGroupSearch, useProjectSearch } from "../hooks/useGroupProjectSearch"
import {
  GroupProjectAssignFields,
  type LinkedEntity,
} from "../components/record/GroupProjectAssignFields"
import type { Group } from "../types/api/group"
import type { Project } from "../types/api/project"
import { useAuthStore } from "../stores/authStore"
import {
  recordMetadataService,
  type CountryOption,
  type IntegrantOption,
  type NamedOption,
} from "../services/record/recordMetadataService"
import { recordService } from "../services/record/recordService"
import type { ExternalAuthor, AuthorId } from "../types/record/types"
import type { UserRole } from "../types"
import type {
  Registro,
  ArticuloRegistro,
  LibroRegistro,
  MonografiaRegistro,
  NormaRegistro,
  PatenteRegistro,
  SoftwareRegistro,
  TesisRegistro,
  EventoRegistro,
  PremioRegistro,
} from "../types/recordList/Registros"
import { recordDetailService } from "../services/record/recordDetailService"
import { usePermissions } from "../hooks/usePermissions"
import { ConfirmDialog } from "../components/common/ConfirmDialog"
import { ZenodoPublishModal } from "../components/zenodo/ZenodoPublishModal"
import {
  extractEntityIdFromResponse,
  mapRecordTypeToEntityType,
} from "../utils/zenodoEntityMapper"
import { zenodoService } from "../services/zenodoService"
import type { ZenodoPublishTarget } from "../types/zenodo"
import {
  validateRequired,
  validateEmailRequired,
  validateDOI,
  validateISSN,
  validateISBN,
  validateYear,
  validateAuthors,
  validateKeywords,
  validateName,
  validateLength,
  extractErrorMessage,
  isDuplicateIdentifierError,
  getDuplicateIdentifierMessage,
} from "../utils/validation"
import { scrollToFirstFormError, scrollToFormError } from "../utils/scrollToFormError"
import { normalizeDoiValue } from "../utils/doiUtils"
import {
  buildArticlePayload,
  buildBookPayload,
  buildEventPayload,
  buildMonographPayload,
  buildNormPayload,
  buildPatentPayload,
  buildPrizePayload,
  buildSoftwarePayload,
  buildThesisPayload,
  resolveTypeIds,
  type RecordPayloadContext,
} from "../utils/recordPayloadBuilders"
type IntegrantSearchHook = {
  term: string
  setTerm: (value: string) => void
  results: IntegrantOption[]
  isLoading: boolean
  error: string | null
}

type RecordFormLocationState = {
  record?: Registro
}

const RECORD_TYPES: RecordType[] = [
  "articulo",
  "libro",
  "monografia",
  "norma",
  "patente",
  "software",
  "evento",
  "premio",
  "tesis",
]

const isRecordTypeValue = (value: string | null | undefined): value is RecordType =>
  Boolean(value && RECORD_TYPES.includes(value as RecordType))

const parseCompositeRecordId = (rawId?: string | null) => {
  if (!rawId) return null
  const [maybeType, ...rest] = rawId.split("-")
  if (isRecordTypeValue(maybeType) && rest.length > 0) {
    return {
      type: maybeType,
      id: rest.join("-"),
    }
  }
  return {
    type: null,
    id: rawId,
  }
}

const createInitialFormData = () => ({
  titulo: "",
  tituloCapitulo: "",
  año: new Date().getFullYear(),
  mes: new Date().getMonth() + 1,
  resumen: "",
  palabrasClave: "",
  pais: "Cuba",
  tipoArticulo: "",
  tipoNorma: "",
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

type RecordFormState = ReturnType<typeof createInitialFormData>

const splitFullName = (fullName: string) => {
  if (!fullName.trim()) {
    return { firstName: fullName, lastName: "" }
  }
  const [firstName, ...rest] = fullName.trim().split(" ")
  return {
    firstName,
    lastName: rest.join(" "),
  }
}

const mapAuthorsFromRecord = (record: Registro) => {
  return (record.autores || []).map((author, index) => {
    const { firstName, lastName } = splitFullName(author.name || "")
    return {
      id: `author-${author.id_integrant ?? index}`,
      integrantId: author.id_integrant,
      usuario: {
        id: author.id_integrant ? String(author.id_integrant) : `author-${index}`,
        nombre: firstName || "Autor",
        apellidos: lastName,
        correoElectronico: author.email || "",
        nombreUsuario: "",
        numeroIdentidad: "",
        roles: [],
        esExterno: false,
        esAdministrador: false,
      },
      nombre: firstName || "Autor",
      apellidos: lastName,
      esExterno: false,
      esPrincipal: index === 0,
      orden: index + 1,
    }
  })
}

const mapTutorsFromRecord = (record: TesisRegistro) => {
  return (record.tutors || []).map((tutor, index) => {
    const { firstName, lastName } = splitFullName(tutor.name || "")
    return {
      id: `tutor-${tutor.id_integrant ?? index}`,
      integrantId: tutor.id_integrant,
      usuario: {
        id: tutor.id_integrant ? String(tutor.id_integrant) : `tutor-${index}`,
        nombre: firstName || "Tutor",
        apellidos: lastName,
        correoElectronico: "",
        nombreUsuario: "",
        numeroIdentidad: "",
        roles: [],
        esExterno: false,
        esAdministrador: false,
      },
      nombre: firstName || "Tutor",
      apellidos: lastName,
      esExterno: false,
      esPrincipal: index === 0,
      orden: index + 1,
    }
  })
}

const mapRecordToFormData = (record: Registro): RecordFormState => {
  const base = createInitialFormData()
  base.titulo = record.titulo || base.titulo
  base.año = record.year_only || base.año
  base.mes = record.month_only || base.mes
  base.resumen = record.resume || base.resumen
  base.palabrasClave = record.keywords || base.palabrasClave
  base.pais = record.country?.name || base.pais

  switch (record.tipo) {
    case "articulo": {
      const article = record as ArticuloRegistro
      base.revista = article.journal || base.revista
      base.volumen = article.voulume || base.volumen
      base.paginas = article.pages || base.paginas
      base.numero = article.number || base.numero
      base.doi = article.doi || base.doi
      base.issn = article.issn || base.issn
      base.tipoArticulo =
        (article.article_type && (article.article_type.name || article.article_type.description)) || base.tipoArticulo
      break
    }
    case "libro": {
      const book = record as LibroRegistro
      base.tituloCapitulo = book.chapter_title || base.tituloCapitulo
      base.editorial = book.publisher || book.editor || base.editorial
      base.volumen = book.voulume || base.volumen
      base.numero = book.number || base.numero
      base.paginas = book.pages || base.paginas
      base.isbn = book.isbn || base.isbn
      break
    }
    case "monografia": {
      const monograph = record as MonografiaRegistro
      base.isbn = monograph.isbn || base.isbn
      base.paginas = monograph.pages || base.paginas
      base.numero = monograph.number || base.numero
      base.registroCENDA = monograph.cenda || base.registroCENDA
      break
    }
    case "norma": {
      const norm = record as NormaRegistro
      base.numeroRegistro = norm.registration_number || base.numeroRegistro
      base.paginas = norm.pages || base.paginas
      base.tipoNorma = (norm.norm_type && (norm.norm_type.name || norm.norm_type.description)) || base.tipoNorma
      break
    }
    case "patente": {
      const patent = record as PatenteRegistro
      base.numeroRegistro = patent.reg_number || base.numeroRegistro
      base.estado = patent.is_conceded ? "concedida" : "tramite"
      break
    }
    case "software": {
      const software = record as SoftwareRegistro
      base.registroCENDA = software.number || base.registroCENDA
      base.estado = software.is_conceded ? "registrado" : ""
      break
    }
    case "evento": {
      const encounter = record as EventoRegistro
      base.nombreEvento = encounter.encounter_name || base.nombreEvento
      base.organizador = encounter.organizer || base.organizador
      base.tipoEvento =
        (encounter.encounter_type && (encounter.encounter_type.name || encounter.encounter_type.description)) ||
        base.tipoEvento
      break
    }
    case "premio": {
      const prize = record as PremioRegistro
      base.tipoPremio = (prize.prize_type && (prize.prize_type.name || prize.prize_type.description)) || base.tipoPremio
      base.institucion = prize.grant_institution || base.institucion
      break
    }
    case "tesis": {
      const thesis = record as TesisRegistro
      base.institucion = thesis.institution || base.institucion
      base.tipoTesis = (thesis.thesis_type && (thesis.thesis_type.name || thesis.thesis_type.description)) || base.tipoTesis
      break
    }
    default:
      break
  }

  return base
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
export const RecordForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  const locationState = (location.state as RecordFormLocationState | null) ?? null
  const recordFromLocation = locationState?.record ?? null
  const parsedRecordKey = parseCompositeRecordId(id)
  const recordNumericId = parsedRecordKey?.id ?? null

  const { user: currentUser } = useAuthStore()
  const { canPublishToZenodo } = usePermissions()
  const isAdmin = currentUser?.roles?.includes("admin") || false

  const isEditMode = Boolean(id && location.pathname.includes("/edit"))
  const isViewMode = Boolean(id && !location.pathname.includes("/edit"))

  const [recordType, setRecordType] = useState<RecordType>(
    (parsedRecordKey?.type as RecordType | undefined) ??
      (recordFromLocation?.tipo as RecordType | undefined) ??
      "articulo"
  )
  const [recordData, setRecordData] = useState<Registro | null>(recordFromLocation ?? null)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordLoadError, setRecordLoadError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [activeTab, setActiveTab] = useState("datos-basicos")

  const [authors, setAuthors] = useState<any[]>([])
  const [tutors, setTutors] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<LinkedEntity | null>(null)
  const [selectedProject, setSelectedProject] = useState<LinkedEntity | null>(null)
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [modalType, setModalType] = useState<"author" | "tutor">("author")
  const [externalPerson, setExternalPerson] = useState({
    nombre: "",
    apellidos: "",
    numeroIdentidad: "",
    entidad: "",
    email: "",
  })
  const [externalPersonEmailError, setExternalPersonEmailError] = useState<string | null>(null)
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [articleTypes, setArticleTypes] = useState<NamedOption[]>([])
  const [normTypes, setNormTypes] = useState<NamedOption[]>([])
  const [prizeTypes, setPrizeTypes] = useState<NamedOption[]>([])
  const [thesisTypes, setThesisTypes] = useState<NamedOption[]>([])
  const [encounterTypes, setEncounterTypes] = useState<NamedOption[]>([])
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)
  const [selectedArticleTypeId, setSelectedArticleTypeId] = useState<number | null>(null)
  const [selectedNormTypeId, setSelectedNormTypeId] = useState<number | null>(null)
  const [selectedPrizeTypeId, setSelectedPrizeTypeId] = useState<number | null>(null)
  const [selectedThesisTypeId, setSelectedThesisTypeId] = useState<number | null>(null)
  const [selectedEncounterTypeId, setSelectedEncounterTypeId] = useState<number | null>(null)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [isMetadataLoading, setIsMetadataLoading] = useState(true)
  const [metadataReloadKey, setMetadataReloadKey] = useState(0)
  const [externalAuthors, setExternalAuthors] = useState<any[]>([])
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<number[]>([])
  const [selectedTutorIds, setSelectedTutorIds] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showZenodoConfirm, setShowZenodoConfirm] = useState(false)
  const [showZenodoModal, setShowZenodoModal] = useState(false)
  const [zenodoTarget, setZenodoTarget] = useState<ZenodoPublishTarget | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState(false)
  const [isDoiLockedByZenodo, setIsDoiLockedByZenodo] = useState(false)

  const authorSearch = useIntegrantSearch()
  const tutorSearch = useIntegrantSearch()
  const groupSearch = useGroupSearch()
  const projectSearch = useProjectSearch()

  const [formData, setFormData] = useState<RecordFormState>(createInitialFormData)

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
    const loadMetadata = async () => {
      try {
        setIsMetadataLoading(true)
        setMetadataError(null)
        const [
          countriesResponse,
          prizeTypesResponse,
          thesisTypesResponse,
          articleTypesResponse,
          normTypesResponse,
          encounterTypesResponse,
        ] = await Promise.all([
          recordMetadataService.getCountries(),
          recordMetadataService.getPrizeTypes(),
          recordMetadataService.getThesisTypes(),
          recordMetadataService.getArticleTypes(),
          recordMetadataService.getNormTypes(),
          recordMetadataService.getEncounterTypes(),
        ])
        setCountries(countriesResponse)
        setPrizeTypes(prizeTypesResponse)
        setThesisTypes(thesisTypesResponse)
        setArticleTypes(articleTypesResponse)
        setNormTypes(normTypesResponse)
        setEncounterTypes(encounterTypesResponse)
      } catch (error) {
        setMetadataError((error as Error).message || "No se pudieron cargar los catálogos")
      } finally {
        setIsMetadataLoading(false)
      }
    }

    loadMetadata()
  }, [metadataReloadKey])

  useEffect(() => {
    if (!parsedRecordKey?.id) return
    setFormData(createInitialFormData())
    setAuthors([])
    setSelectedAuthorIds([])
    setTutors([])
    setSelectedTutorIds([])
    setSelectedGroup(null)
    setSelectedProject(null)
    groupSearch.setTerm("")
    projectSearch.setTerm("")
    setIsSaved(false)
    setRecordLoadError(null)
  }, [parsedRecordKey?.id])

  useEffect(() => {
    if (id) return
    setRecordData(null)
    setFormData(createInitialFormData())
    setAuthors([])
    setSelectedAuthorIds([])
    setTutors([])
    setSelectedTutorIds([])
    setSelectedGroup(null)
    setSelectedProject(null)
    groupSearch.setTerm("")
    projectSearch.setTerm("")
    setIsSaved(false)
    setRecordLoadError(null)
    setSelectedCountryId(null)
    setSelectedArticleTypeId(null)
    setSelectedNormTypeId(null)
    setSelectedPrizeTypeId(null)
    setSelectedThesisTypeId(null)
    setSelectedEncounterTypeId(null)
    setRecordType("articulo")
  }, [id])

  useEffect(() => {
    if (!id) return
    if (parsedRecordKey?.type) return
    setRecordLoadError("No se pudo determinar el tipo de registro. Acceda desde la lista e inténtelo nuevamente.")
  }, [id, parsedRecordKey?.type])

  useEffect(() => {
    if (!recordFromLocation) return
    setRecordData(recordFromLocation)
    setRecordLoadError(null)
    setRecordLoading(false)
  }, [recordFromLocation])

  useEffect(() => {
    if (!parsedRecordKey?.id || !parsedRecordKey.type) return

    if (
      recordFromLocation &&
      recordFromLocation.id === parsedRecordKey.id &&
      recordFromLocation.tipo === parsedRecordKey.type
    ) {
      return
    }

    let isMounted = true
    setRecordLoading(true)
    setRecordLoadError(null)

    recordDetailService
      .getRecord(parsedRecordKey.type, parsedRecordKey.id)
      .then((record) => {
        if (!isMounted) return
        setRecordData(record)
      })
      .catch((error) => {
        if (!isMounted) return
        setRecordLoadError(error.message || "No se pudo cargar la información del registro seleccionado")
      })
      .finally(() => {
        if (!isMounted) return
        setRecordLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [parsedRecordKey?.id, parsedRecordKey?.type, recordFromLocation])

  useEffect(() => {
    const recordTypeForZenodo = (parsedRecordKey?.type ?? recordType) as RecordType
    if (recordTypeForZenodo !== "articulo" || !recordNumericId) {
      setIsDoiLockedByZenodo(false)
      return
    }

    const entityId = Number(recordNumericId)
    if (Number.isNaN(entityId)) {
      setIsDoiLockedByZenodo(false)
      return
    }

    let isMounted = true

    zenodoService
      .getPublication("article", entityId)
      .then((publication) => {
        if (!isMounted) return
        const isPublished = publication?.status === "published"
        setIsDoiLockedByZenodo(isPublished)
        if (isPublished) {
          const publishedDoi = normalizeDoiValue(publication?.doi)
          if (publishedDoi) {
            setFormData((prev) => ({ ...prev, doi: publishedDoi }))
          }
        }
      })
      .catch(() => {
        if (!isMounted) return
        setIsDoiLockedByZenodo(false)
      })

    return () => {
      isMounted = false
    }
  }, [parsedRecordKey?.type, recordType, recordNumericId, recordData?.id])

  useEffect(() => {
    if (!recordData) return

    setRecordLoadError(null)
    setRecordType(recordData.tipo as RecordType)
    setIsSaved(true)

    const hydratedForm = mapRecordToFormData(recordData)
    setFormData(hydratedForm)

    const mappedAuthors = mapAuthorsFromRecord(recordData)
    setAuthors(mappedAuthors)
    setSelectedAuthorIds(
      mappedAuthors
        .map((author) => author.integrantId)
        .filter((value): value is number => typeof value === "number")
    )

    if (recordData.tipo === "tesis") {
      const thesisTutors = mapTutorsFromRecord(recordData as TesisRegistro)
      setTutors(thesisTutors)
      setSelectedTutorIds(
        thesisTutors
          .map((tutor) => tutor.integrantId)
          .filter((value): value is number => typeof value === "number")
      )
    } else {
      setTutors([])
      setSelectedTutorIds([])
    }

    setSelectedCountryId(recordData.id_country ?? null)

    if (recordData.tipo === "articulo") {
      const article = recordData as ArticuloRegistro
      setSelectedArticleTypeId(article.article_type?.id_article_type ?? null)
    } else {
      setSelectedArticleTypeId(null)
    }

    if (recordData.tipo === "norma") {
      const norm = recordData as NormaRegistro
      setSelectedNormTypeId(norm.norm_type?.id_norm_type ?? null)
    } else {
      setSelectedNormTypeId(null)
    }

    if (recordData.tipo === "premio") {
      const prize = recordData as PremioRegistro
      setSelectedPrizeTypeId(prize.prize_type?.id_prize_type ?? null)
    } else {
      setSelectedPrizeTypeId(null)
    }

    if (recordData.tipo === "tesis") {
      const thesis = recordData as TesisRegistro
      setSelectedThesisTypeId(thesis.thesis_type?.id_thesis_type ?? null)
    } else {
      setSelectedThesisTypeId(null)
    }

    if (recordData.tipo === "evento") {
      const encounter = recordData as EventoRegistro
      setSelectedEncounterTypeId(encounter.encounter_type?.id_encounter_type ?? null)
    } else {
      setSelectedEncounterTypeId(null)
    }

    const loadLinkedGroupAndProject = async () => {
      if (recordData.id_group) {
        try {
          const group = await groupService.getGroupById(recordData.id_group)
          setSelectedGroup({ id: group.id_group, label: group.name })
          groupSearch.setTerm(group.name)
        } catch {
          setSelectedGroup({ id: recordData.id_group, label: `Grupo #${recordData.id_group}` })
          groupSearch.setTerm("")
        }
      } else {
        setSelectedGroup(null)
        groupSearch.setTerm("")
      }

      if (recordData.id_project) {
        try {
          const project = await projectService.getProjectById(recordData.id_project)
          setSelectedProject({ id: project.id_project, label: project.title })
          projectSearch.setTerm(project.title)
        } catch {
          setSelectedProject({
            id: recordData.id_project,
            label: `Proyecto #${recordData.id_project}`,
          })
          projectSearch.setTerm("")
        }
      } else {
        setSelectedProject(null)
        projectSearch.setTerm("")
      }
    }

    loadLinkedGroupAndProject()
  }, [recordData])

  useEffect(() => {
    if (!countries.length || selectedCountryId) {
      return
    }
    const countryMatch = countries.find((country) => country.name === formData.pais)
    if (countryMatch) {
      setSelectedCountryId(countryMatch.id_country)
      return
    }
    const fallbackCountry = countries[0]
    if (fallbackCountry) {
      setSelectedCountryId(fallbackCountry.id_country)
      setFormData((prev) => ({
        ...prev,
        pais: fallbackCountry.name,
      }))
    }
  }, [countries, formData.pais, selectedCountryId])

  useEffect(() => {
    if (isEditMode || isViewMode || isSaved) {
      return
    }
    setSelectedArticleTypeId(null)
    setSelectedNormTypeId(null)
    setSelectedPrizeTypeId(null)
    setSelectedThesisTypeId(null)
    setSelectedEncounterTypeId(null)
  }, [recordType, isEditMode, isViewMode, isSaved])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode) {
      void handleUpdateRecord()
      return
    }

    setIsSaved(true)
    setActiveTab("autores")
    setSuccessMessage("Datos básicos guardados con éxito. Complete autores y, si aplica, grupo o proyecto.")
    setShowSuccessDialog(true)
  }

  const getAuthorIdsForUpdate = (): number[] =>
    authors
      .map((author) => author.integrantId)
      .filter((id): id is number => typeof id === "number")

  const buildPayloadContext = (
    recordTypeForPayload: RecordType,
    authorIds: number[],
    options?: { includeDoi?: boolean },
  ): RecordPayloadContext => {
    const resolvedTypes = resolveTypeIds(
      recordTypeForPayload,
      formData,
      {
        selectedArticleTypeId,
        selectedNormTypeId,
        selectedPrizeTypeId,
        selectedThesisTypeId,
        selectedEncounterTypeId,
      },
      {
        articleTypes,
        normTypes,
        prizeTypes,
        thesisTypes,
        encounterTypes,
      },
    )

    return {
      formData,
      authorIds,
      tutorIds: selectedTutorIds,
      selectedCountryId,
      ...resolvedTypes,
      id_group: selectedGroup?.id ?? null,
      id_project: selectedProject?.id ?? null,
      includeDoi: options?.includeDoi ?? !isDoiLockedByZenodo,
    }
  }

  const handleSelectIntegrant = (integrant: IntegrantOption, type: "author" | "tutor") => {
    const alreadySelected =
      type === "author"
        ? selectedAuthorIds.includes(integrant.id_integrant)
        : selectedTutorIds.includes(integrant.id_integrant)

    if (alreadySelected) {
      setSuccessMessage(
        type === "author"
          ? "Este integrante ya forma parte de los autores"
          : "Este integrante ya está registrado como tutor"
      )
      setShowSuccessDialog(true)
      return
    }

    const { firstName, lastName } = splitFullName(integrant.name)
    const newPerson = {
      id: `${type}-${integrant.id_integrant}-${Date.now()}`,
      integrantId: integrant.id_integrant,
      usuario: {
        id: integrant.id_integrant,
        nombre: firstName,
        apellidos: lastName,
        correoElectronico: integrant.email,
        lugarTrabajo: integrant.work_center,
        esExterno: false,
      },
      nombre: firstName,
      apellidos: lastName,
      esExterno: false,
      esPrincipal: type === "author" ? authors.length === 0 : false,
      orden: type === "author" ? authors.length + 1 : tutors.length + 1,
    }

    if (type === "author") {
      setAuthors([...authors, newPerson])
      setSelectedAuthorIds([...selectedAuthorIds, integrant.id_integrant])
    } else {
      setTutors([...tutors, newPerson])
      setSelectedTutorIds([...selectedTutorIds, integrant.id_integrant])
    }

    setSuccessMessage(type === "author" ? "Autor agregado con éxito" : "Tutor agregado con éxito")
    setShowSuccessDialog(true)
  }

  const handleCountryChange = (value: string) => {
    if (!value) {
      setSelectedCountryId(null)
      setFormData((prev) => ({
        ...prev,
        pais: "",
      }))
      return
    }
    const parsedId = Number(value)
    setSelectedCountryId(parsedId)
    const selectedCountry = countries.find((country) => country.id_country === parsedId)
    setFormData((prev) => ({
      ...prev,
      pais: selectedCountry ? selectedCountry.name : "",
    }))
  }

  const handleThesisTypeChange = (value: string) => {
    const parsedId = value ? Number(value) : null
    setSelectedThesisTypeId(parsedId)
    const selectedType = thesisTypes.find((type) => type.id === parsedId)
    setFormData((prev) => ({
      ...prev,
      tipoTesis: selectedType ? selectedType.name : "",
    }))
  }

  const handlePrizeTypeChange = (value: string) => {
    const parsedId = value ? Number(value) : null
    setSelectedPrizeTypeId(parsedId)
    const selectedType = prizeTypes.find((type) => type.id === parsedId)
    setFormData((prev) => ({
      ...prev,
      tipoPremio: selectedType ? selectedType.name : "",
    }))
  }

  const handleEncounterTypeChange = (value: string) => {
    const parsedId = value ? Number(value) : null
    setSelectedEncounterTypeId(parsedId)
    const selectedType = encounterTypes.find((type) => type.id === parsedId)
    setFormData((prev) => ({
      ...prev,
      tipoEvento: selectedType ? selectedType.name : "",
    }))
  }

  const handleSelectArticleType = (option: NamedOption) => {
    setSelectedArticleTypeId(option.id)
    setFormData((prev) => ({
      ...prev,
      tipoArticulo: option.name,
    }))
  }

  const handleSelectNormType = (option: NamedOption) => {
    setSelectedNormTypeId(option.id)
    setFormData((prev) => ({
      ...prev,
      tipoNorma: option.name,
    }))
  }

  const renderAutocompleteList = (
    inputValue: string,
    options: NamedOption[],
    onSelect: (option: NamedOption) => void
  ) => {
    if (!inputValue.trim() || isViewMode) {
      return null
    }
    const matches = options
      .filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()))
      .slice(0, 6)

    if (!matches.length) {
      return null
    }

    return (
      <ul className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
        {matches.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-100"
              onMouseDown={() => onSelect(option)}
            >
              {option.name}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  const handleAddExternal = (e: React.FormEvent) => {
    e.preventDefault()
    setExternalPersonEmailError(null)
    const emailErr = validateEmailRequired(externalPerson.email, "Correo electrónico")
    if (emailErr) {
      setExternalPersonEmailError(emailErr)
      return
    }
    const newPerson = {
      id: `external-${Date.now()}`,
      integrantId: null,
      usuario: {
        id: `external-${Date.now()}`,
        nombre: externalPerson.nombre,
        apellidos: externalPerson.apellidos,
        numeroIdentidad: externalPerson.numeroIdentidad,
        entidad: externalPerson.entidad,
        correoElectronico: externalPerson.email,
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
      setExternalAuthors([...externalAuthors, newPerson])
      setSuccessMessage("Autor externo agregado con éxito")
    } else {
      setTutors([...tutors, newPerson])
      setSuccessMessage("Tutor externo agregado con éxito")
    }
    setShowExternalModal(false)
    setExternalPerson({ nombre: "", apellidos: "", numeroIdentidad: "", entidad: "", email: "" })
    setExternalPersonEmailError(null)
    setShowSuccessDialog(true)
  }

  const handleRemoveAuthor = (authorId: string) => {
    const authorToRemove = authors.find((author) => author.id === authorId)
    
    // Prevenir que el usuario se elimine a sí mismo como autor
    const userId = currentUser?.id ? parseInt(currentUser.id) : null
    if (authorToRemove?.integrantId && userId && authorToRemove.integrantId === userId) {
      setSuccessMessage("No puede eliminarse a sí mismo como autor del registro")
      setShowSuccessDialog(true)
      return
    }
    
    setAuthors(authors.filter((a) => a.id !== authorId))
    if (authorToRemove?.integrantId) {
      setSelectedAuthorIds((prev) => prev.filter((value) => value !== authorToRemove.integrantId))
    }
    if (authorToRemove?.esExterno) {
      setExternalAuthors((prev) => prev.filter((external) => external.id !== authorId))
    }
  }

  const handleRemoveTutor = (tutorId: string) => {
    const tutorToRemove = tutors.find((tutor) => tutor.id === tutorId)
    setTutors(tutors.filter((t) => t.id !== tutorId))
    if (tutorToRemove?.integrantId) {
      setSelectedTutorIds((prev) => prev.filter((value) => value !== tutorToRemove.integrantId))
    }
  }

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup({ id: group.id_group, label: group.name })
    groupSearch.setTerm(group.name)
  }

  const handleSelectProject = (project: Project) => {
    setSelectedProject({ id: project.id_project, label: project.title })
    projectSearch.setTerm(project.title)
  }

  const handleClearGroup = () => {
    setSelectedGroup(null)
    groupSearch.setTerm("")
  }

  const handleClearProject = () => {
    setSelectedProject(null)
    projectSearch.setTerm("")
  }

  // Helper para construir author_ids (IDs de integrantes + objetos de autores externos)
  const buildAuthorIds = (): AuthorId[] => {
    const authorIds: AuthorId[] = []
    
    // Agregar IDs de integrantes CUJAE
    selectedAuthorIds.forEach((id) => {
      authorIds.push(id)
    })
    
    // Agregar objetos de autores externos
    externalAuthors.forEach((external) => {
      const externalAuthor: ExternalAuthor = {
        name: `${external.nombre} ${external.apellidos}`,
        work_center: external.usuario?.entidad || "",
        email: external.usuario?.correoElectronico || "",
        id_country: selectedCountryId || 1, // Usar país seleccionado o default
      }
      authorIds.push(externalAuthor)
    })
    
    return authorIds
  }

  // Función para validar todos los campos antes de enviar
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}

    // Validar campos requeridos comunes
    const tituloError = validateRequired(formData.titulo, "Título")
    if (tituloError) errors.titulo = tituloError

    const añoError = validateYear(formData.año)
    if (añoError) errors.año = añoError

    // Validar autores
    const authorsError = validateAuthors(authors)
    if (authorsError) errors.authors = authorsError

    // Validar palabras clave si están presentes
    if (formData.palabrasClave) {
      const keywordsError = validateKeywords(formData.palabrasClave)
      if (keywordsError) errors.palabrasClave = keywordsError
    }

    // Validaciones específicas por tipo de registro
    switch (recordType) {
      case "articulo":
        if (formData.issn) {
          const issnError = validateISSN(formData.issn)
          if (issnError) errors.issn = issnError
        }
        if (formData.doi && !isDoiLockedByZenodo) {
          const doiError = validateDOI(formData.doi)
          if (doiError) errors.doi = doiError
        }
        break
      case "libro":
        if (formData.isbn) {
          const isbnError = validateISBN(formData.isbn)
          if (isbnError) errors.isbn = isbnError
        }
        break
      case "monografia":
        if (formData.isbn) {
          const isbnError = validateISBN(formData.isbn)
          if (isbnError) errors.isbn = isbnError
        }
        break
    }

    // Validar emails de autores externos
    externalAuthors.forEach((author, index) => {
      const emailError = validateEmailRequired(
        author.usuario?.correoElectronico,
        `Correo electrónico (autor externo ${index + 1})`,
      )
      if (emailError) {
        errors[`externalAuthorEmail_${index}`] = emailError
      }
    })

    tutors.forEach((tutor, index) => {
      if (!tutor.usuario?.esExterno) return
      const emailError = validateEmailRequired(
        tutor.usuario?.correoElectronico,
        `Correo electrónico (tutor externo ${index + 1})`,
      )
      if (emailError) {
        errors[`externalTutorEmail_${index}`] = emailError
      }
    })

    setFieldErrors(errors)
    return errors
  }

  const applyValidationErrors = (errors: Record<string, string>) => {
    setFieldErrors(errors)
    setSubmitError(
      `Por favor, corrija los errores en el formulario: ${Object.values(errors).join(" · ")}`,
    )
    scrollToFirstFormError(errors, {
      setActiveTab,
      recordType,
    })
  }

  const handleFinishRecordFlow = () => {
    setTimeout(() => {
      navigate("/records")
    }, pendingNavigation ? 0 : 1500)
  }

  const handleConfirmZenodoPublish = () => {
    setShowZenodoConfirm(false)
    setShowZenodoModal(true)
  }

  const handleSkipZenodoPublish = () => {
    setShowZenodoConfirm(false)
    setZenodoTarget(null)
    handleFinishRecordFlow()
  }

  const handleSaveCompleteRecord = async () => {
    const recordValidationErrors = validateForm()
    if (Object.keys(recordValidationErrors).length > 0) {
      applyValidationErrors(recordValidationErrors)
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setFieldErrors({})

      const authorIds = buildAuthorIds()
      const payloadContext = buildPayloadContext(recordType, [], { includeDoi: true })

      let createdEntityId: number | null = null

      switch (recordType) {
        case "articulo": {
          const response = await recordService.createArticle({
            ...buildArticlePayload(payloadContext, "create"),
            author_ids: authorIds,
          })
          createdEntityId = extractEntityIdFromResponse("articulo", response.data as Record<string, unknown>)
          break
        }
        case "libro": {
          const response = await recordService.createBook({
            ...buildBookPayload(payloadContext),
            author_ids: authorIds,
          })
          createdEntityId = extractEntityIdFromResponse("libro", response.data as Record<string, unknown>)
          break
        }
        case "monografia": {
          const response = await recordService.createMonograph({
            ...buildMonographPayload(payloadContext),
            author_ids: authorIds,
          })
          createdEntityId = extractEntityIdFromResponse("monografia", response.data as Record<string, unknown>)
          break
        }
        case "norma": {
          const response = await recordService.createNorm({
            ...buildNormPayload(payloadContext),
            author_ids: authorIds,
          })
          createdEntityId = extractEntityIdFromResponse("norma", response.data as Record<string, unknown>)
          break
        }
        case "patente": {
          const response = await recordService.createPatent({
            ...buildPatentPayload(payloadContext),
            author_ids: authorIds,
          })
          createdEntityId = extractEntityIdFromResponse("patente", response.data as Record<string, unknown>)
          break
        }
        case "software": {
          const response = await recordService.createSoftware({
            ...buildSoftwarePayload(payloadContext),
            author_ids: authorIds,
          })
          createdEntityId = extractEntityIdFromResponse("software", response.data as Record<string, unknown>)
          break
        }
        case "evento": {
          const response = await recordService.createEvent({
            ...buildEventPayload(payloadContext),
            author_ids: authorIds,
          })
          createdEntityId = extractEntityIdFromResponse("evento", response.data as Record<string, unknown>)
          break
        }
        case "premio": {
          const response = await recordService.createPrize({
            ...buildPrizePayload(payloadContext),
            author_ids: authorIds,
          })
          createdEntityId = extractEntityIdFromResponse("premio", response.data as Record<string, unknown>)
          break
        }
        case "tesis": {
          const response = await recordService.createThesis({
            ...buildThesisPayload(payloadContext),
            author_ids: authorIds,
          })
          createdEntityId = extractEntityIdFromResponse("tesis", response.data as Record<string, unknown>)
          break
        }
        default:
          throw new Error("Tipo de registro no válido")
      }

      setSuccessMessage("Registro científico guardado con éxito")
      setShowSuccessDialog(true)

      if (canPublishToZenodo() && createdEntityId !== null) {
        setZenodoTarget({
          entityType: mapRecordTypeToEntityType(recordType),
          entityId: createdEntityId,
          recordType,
          title: formData.titulo,
        })
        setShowZenodoConfirm(true)
        return
      }

      handleFinishRecordFlow()
    } catch (error: unknown) {
      if (isDuplicateIdentifierError(error)) {
        const friendlyMessage = getDuplicateIdentifierMessage(error)
        setSubmitError(friendlyMessage)
        scrollToDuplicateFieldError(friendlyMessage)
      } else {
        const errorMessage = extractErrorMessage(error) || "Error al guardar el registro"
        setSubmitError(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToDuplicateFieldError = (message: string) => {
    const lower = message.toLowerCase()
    if (lower.includes("doi")) {
      scrollToFormError({ fieldKey: "doi", setActiveTab, recordType })
      return
    }
    if (lower.includes("issn")) {
      scrollToFormError({ fieldKey: "issn", setActiveTab, recordType })
      return
    }
    if (lower.includes("isbn")) {
      scrollToFormError({ fieldKey: "isbn", setActiveTab, recordType })
      return
    }
    scrollToFormError({ fieldKey: "titulo", setActiveTab, recordType })
  }

  const handleUpdateRecord = async () => {
    const effectiveRecordType = (parsedRecordKey?.type ?? recordType) as RecordType

    if (!recordNumericId) {
      setSubmitError("No se pudo identificar el registro a actualizar.")
      return
    }

    if (!isRecordTypeValue(effectiveRecordType)) {
      setSubmitError("No se pudo determinar el tipo de registro para actualizar.")
      return
    }

    const recordValidationErrors = validateForm()
    if (Object.keys(recordValidationErrors).length > 0) {
      applyValidationErrors(recordValidationErrors)
      return
    }

    const entityId = Number(recordNumericId)
    if (Number.isNaN(entityId)) {
      setSubmitError("El identificador del registro no es válido.")
      scrollToFormError({ fieldKey: "titulo", setActiveTab, recordType })
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setFieldErrors({})

      const authorIdsForUpdate = getAuthorIdsForUpdate()
      const payloadContext = buildPayloadContext(effectiveRecordType, authorIdsForUpdate)

      switch (effectiveRecordType) {
        case "articulo":
          await recordService.updateArticle(
            entityId,
            buildArticlePayload(payloadContext, "update"),
          )
          break
        case "libro":
          await recordService.updateBook(entityId, buildBookPayload(payloadContext))
          break
        case "monografia":
          await recordService.updateMonograph(entityId, buildMonographPayload(payloadContext))
          break
        case "norma":
          await recordService.updateNorm(entityId, buildNormPayload(payloadContext))
          break
        case "patente":
          await recordService.updatePatent(entityId, buildPatentPayload(payloadContext))
          break
        case "software":
          await recordService.updateSoftware(entityId, buildSoftwarePayload(payloadContext))
          break
        case "evento":
          await recordService.updateEvent(entityId, buildEventPayload(payloadContext))
          break
        case "premio":
          await recordService.updatePrize(entityId, buildPrizePayload(payloadContext))
          break
        case "tesis":
          await recordService.updateThesis(entityId, buildThesisPayload(payloadContext))
          break
        default:
          throw new Error("Tipo de registro no válido")
      }

      setSuccessMessage("Registro actualizado con éxito")
      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/records")
      }, 1500)
    } catch (error: unknown) {
      if (isDuplicateIdentifierError(error)) {
        const friendlyMessage = getDuplicateIdentifierMessage(error)
        setSubmitError(friendlyMessage)
        scrollToDuplicateFieldError(friendlyMessage)
        return
      }
      const errorMessage = extractErrorMessage(error) || "Error al actualizar el registro"
      setSubmitError(errorMessage)
      scrollToFormError({ fieldKey: "titulo", setActiveTab, recordType })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === "doi" && isDoiLockedByZenodo) {
      return
    }
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
                disabled={isViewMode ? true : false}
              />
            </div>
            <div className="form-group relative">
              <label htmlFor="tipoArticulo">Tipo de Artículo</label>
              <Input
                id="tipoArticulo"
                name="tipoArticulo"
                type="text"
                value={formData.tipoArticulo}
                onChange={(event) => {
                  setSelectedArticleTypeId(null)
                  handleChange(event)
                }}
                placeholder="Ej: Investigativo, Opinión..."
                disabled={isViewMode}
              />
              {renderAutocompleteList(formData.tipoArticulo, articleTypes, handleSelectArticleType)}
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
              {fieldErrors.issn && <span className="field-error">{fieldErrors.issn}</span>}
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
                disabled={isViewMode || isDoiLockedByZenodo}
                readOnly={isDoiLockedByZenodo}
                aria-describedby="doi-hint"
                aria-readonly={isDoiLockedByZenodo}
              />
              <small id="doi-hint" className="form-hint">
                {isDoiLockedByZenodo
                  ? "Este registro fue publicado en Zenodo. El DOI asignado no puede modificarse."
                  : "Complételo solo si la publicación es de acceso público. Al publicar en Zenodo, el DOI asignado se guardará aquí automáticamente."}
              </small>
              {fieldErrors.doi && (
                <span className="field-error" role="alert">
                  {fieldErrors.doi}
                </span>
              )}
            </div>
          </>
        )
      case "libro":
        return (
          <>
            <div className="form-group full-width">
              <label htmlFor="tituloCapitulo">Título del capítulo</label>
              <Input
                id="tituloCapitulo"
                name="tituloCapitulo"
                type="text"
                value={formData.tituloCapitulo}
                onChange={handleChange}
                placeholder="Título del capítulo (si aplica)"
                disabled={isViewMode ? true : false}
              />
            </div>
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
              {fieldErrors.isbn && <span className="field-error">{fieldErrors.isbn}</span>}
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
              {fieldErrors.isbn && <span className="field-error">{fieldErrors.isbn}</span>}
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
      case "norma":
        return (
          <>
            <div className="form-group">
              <label htmlFor="numeroRegistro">
                Número de Registro <span className="required">*</span>
              </label>
              <Input
                id="numeroRegistro"
                name="numeroRegistro"
                type="text"
                value={formData.numeroRegistro}
                onChange={handleChange}
                required
                disabled={isViewMode}
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
                disabled={isViewMode}
              />
            </div>
            <div className="form-group relative">
              <label htmlFor="tipoNorma">Tipo de Norma</label>
              <Input
                id="tipoNorma"
                name="tipoNorma"
                type="text"
                value={formData.tipoNorma}
                onChange={(event) => {
                  setSelectedNormTypeId(null)
                  handleChange(event)
                }}
                placeholder="Seleccione desde la lista sugerida"
                disabled={isViewMode}
              />
              {renderAutocompleteList(formData.tipoNorma, normTypes, handleSelectNormType)}
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
              value={selectedThesisTypeId ?? ""}
              onChange={(event) => handleThesisTypeChange(event.target.value)}
              required
              className="form-select"
            >
              <option value="">Seleccione tipo</option>
              {thesisTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
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
              {isViewMode ? (
                <Input
                  id="tipoEvento"
                  name="tipoEvento"
                  type="text"
                  value={formData.tipoEvento}
                  onChange={handleChange}
                  disabled
                />
              ) : (
                <select
                  id="tipoEvento"
                  name="tipoEvento"
                  value={selectedEncounterTypeId ?? ""}
                  onChange={(event) => handleEncounterTypeChange(event.target.value)}
                  className="form-select"
                >
                  <option value="">Seleccione tipo</option>
                  {encounterTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        )
      case "premio":
        return (
          <>
            <div className="form-group">
              <label htmlFor="tipoPremio">Tipo de Premio</label>
              {isViewMode ? (
                <Input
                  id="tipoPremio"
                  name="tipoPremio"
                  type="text"
                  value={formData.tipoPremio}
                  onChange={handleChange}
                  disabled
                />
              ) : (
                <select
                  id="tipoPremio"
                  name="tipoPremio"
                  value={selectedPrizeTypeId ?? ""}
                  onChange={(event) => handlePrizeTypeChange(event.target.value)}
                  className="form-select"
                >
                  <option value="">Seleccione tipo</option>
                  {prizeTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              )}
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
  ]

  if (isMetadataLoading) {
    return (
      <div className="record-form">
        <Card>
          <p>Cargando catálogos iniciales...</p>
        </Card>
      </div>
    )
  }

  if (metadataError) {
    return (
      <div className="record-form">
        <Card>
          <p className="error-message">{metadataError}</p>
          <div className="form-actions">
            <Button type="button" onClick={() => setMetadataReloadKey((prev) => prev + 1)}>
              Reintentar carga
            </Button>
          </div>
        </Card>
      </div>
    )
  }

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
        isOpen={showExternalModal}
        onClose={() => {
          setShowExternalModal(false)
          setExternalPersonEmailError(null)
        }}
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
          <div className="form-group">
            <Input
              label="Correo electrónico *"
              type="email"
              value={externalPerson.email}
              onChange={(e) => {
                setExternalPersonEmailError(null)
                setExternalPerson({ ...externalPerson, email: e.target.value })
              }}
              placeholder="ejemplo@universidad.edu"
              error={externalPersonEmailError ?? undefined}
              autoComplete="email"
            />
          </div>
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowExternalModal(false)
                setExternalPersonEmailError(null)
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showZenodoConfirm}
        title="Publicar en Zenodo"
        message="El registro se guardó correctamente. ¿Desea publicarlo ahora en Zenodo? Deberá adjuntar un archivo PDF."
        confirmText="Sí, publicar"
        cancelText="No, más tarde"
        onConfirm={handleConfirmZenodoPublish}
        onCancel={handleSkipZenodoPublish}
      />

      <ZenodoPublishModal
        isOpen={showZenodoModal}
        target={zenodoTarget}
        onClose={() => {
          setShowZenodoModal(false)
          setZenodoTarget(null)
          handleFinishRecordFlow()
        }}
        onPublished={(_url, publication) => {
          if (publication?.status === "published") {
            setIsDoiLockedByZenodo(true)
          }
          const publishedDoi = normalizeDoiValue(publication?.doi)
          if (publishedDoi && recordType === "articulo") {
            setFormData((prev) => ({ ...prev, doi: publishedDoi }))
          }
          setPendingNavigation(true)
        }}
      />

      {(isViewMode || isEditMode) && recordLoading && (
        <Card>
          <p>Cargando datos del registro seleccionado...</p>
        </Card>
      )}

      {recordLoadError && (
        <Card>
          <p className="error-message">{recordLoadError}</p>
        </Card>
      )}

      <div className="form-header" id="record-form-top">
        <h1>{id ? "Editar Registro Científico" : "Adicionar Registro Científico"}</h1>
        <p>Complete la información del registro</p>
      </div>

      <div className="record-type-menu">
        {recordTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            className={`type-menu-item ${recordType === type.value ? "selected" : ""}`}
            onClick={() => !isViewMode && !isSaved && !isEditMode && setRecordType(type.value)}
            disabled={isViewMode || isSaved || isEditMode}
          >
            {type.label}
          </button>
        ))}
      </div>
      {isEditMode && (
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
          El tipo de registro no puede ser modificado
        </p>
      )}

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
                    {fieldErrors.titulo && <span className="field-error">{fieldErrors.titulo}</span>}
                  </div>

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
                    {fieldErrors.año && <span className="field-error">{fieldErrors.año}</span>}
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
                    {isViewMode ? (
                      <Input id="pais" name="pais" type="text" value={formData.pais} onChange={handleChange} disabled />
                    ) : (
                      <select
                        id="pais"
                        name="pais"
                        value={selectedCountryId ?? ""}
                        onChange={(event) => handleCountryChange(event.target.value)}
                        className="form-select"
                        disabled={countries.length === 0}
                      >
                        <option value="">Seleccione un país</option>
                        {countries.map((country) => (
                          <option key={country.id_country} value={country.id_country}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    )}
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
                    <small className="form-hint">Separe múltiples palabras clave con comas (mínimo 3, máximo 10)</small>
                    {fieldErrors.palabrasClave && <span className="field-error">{fieldErrors.palabrasClave}</span>}
                  </div>
                </div>
              </div>

              <GroupProjectAssignFields
                selectedGroup={selectedGroup}
                selectedProject={selectedProject}
                groupSearchTerm={groupSearch.term}
                projectSearchTerm={projectSearch.term}
                onGroupSearchTermChange={(value) => {
                  if (selectedGroup) setSelectedGroup(null)
                  groupSearch.setTerm(value)
                }}
                onProjectSearchTermChange={(value) => {
                  if (selectedProject) setSelectedProject(null)
                  projectSearch.setTerm(value)
                }}
                groupResults={groupSearch.results}
                projectResults={projectSearch.results}
                groupLoading={groupSearch.isLoading}
                projectLoading={projectSearch.isLoading}
                groupError={groupSearch.error}
                projectError={projectSearch.error}
                onSelectGroup={handleSelectGroup}
                onSelectProject={handleSelectProject}
                onClearGroup={handleClearGroup}
                onClearProject={handleClearProject}
                disabled={isViewMode}
              />

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
            <div className="form-section" id="authors-section" data-field-key="authors">
              <div className="tab-header">
                <h3>Autores del Registro</h3>
                {!isViewMode && (
                  <div className="tab-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      aria-label="Agregar autor externo"
                      onClick={() => {
                        setModalType("author")
                        setExternalPersonEmailError(null)
                        setShowExternalModal(true)
                      }}
                    >
                      Registrar Autor Externo
                    </Button>
                  </div>
                )}
              </div>

              {!isViewMode && (
                <div className="form-group full-width">
                  <label htmlFor="authorSearch">Buscar integrante CUJAE</label>
                  <Input
                    id="authorSearch"
                    name="authorSearch"
                    type="text"
                    value={authorSearch.term}
                    onChange={(event) => authorSearch.setTerm(event.target.value)}
                    placeholder="Escribe un nombre, correo o centro de trabajo"
                    aria-label="Campo para buscar integrantes"
                  />
                  <small className="form-hint">
                    Filtramos automáticamente contra el directorio en línea y puedes seleccionar los resultados.
                  </small>
                </div>
              )}

              {!isViewMode && (
                <div className="record-list">
                  {authorSearch.isLoading ? (
                    <p className="empty-state">Buscando integrantes...</p>
                  ) : authorSearch.error ? (
                    <p className="error-message">{authorSearch.error}</p>
                  ) : authorSearch.results.length === 0 ? (
                    <p className="empty-state">Escribe al menos 2 caracteres para obtener coincidencias</p>
                  ) : (
                    authorSearch.results.map((integrant) => (
                      <div key={integrant.id_integrant} className="record-item">
                        <div className="record-item-info">
                          <strong>{integrant.name}</strong>
                          <span>{integrant.email || "Sin correo"}</span>
                          <span>{integrant.work_center || "Sin centro de trabajo"}</span>
                        </div>
                        <Button
                          size="sm"
                          aria-label={`Agregar ${integrant.name} como autor`}
                          onClick={() => handleSelectIntegrant(integrant, "author")}
                        >
                          Agregar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {fieldErrors.authors && (
                <p className="field-error" role="alert">
                  {fieldErrors.authors}
                </p>
              )}
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
                                    className: (() => {
                                      const userId = currentUser?.id ? parseInt(currentUser.id) : null
                                      const isCurrentUser = author.integrantId && userId && author.integrantId === userId
                                      return isCurrentUser ? "disabled" : ""
                                    })(),
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

              {externalAuthors.length > 0 && (
                <div className="external-authors">
                  <h4>Autores externos registrados</h4>
                  <ul>
                    {externalAuthors.map((author) => (
                      <li key={author.id}>{`${author.nombre} ${author.apellidos} - ${
                        author.usuario?.entidad || "Sin entidad"
                      }`}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {(isSaved || isViewMode || isEditMode) && activeTab === "tutores" && recordType === "tesis" && (
            <div className="form-section" id="tutores-section" data-field-key="tutors">
              <div className="tab-header">
                <h3>Tutores de la Tesis</h3>
                {!isViewMode && (
                  <div className="tab-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      aria-label="Agregar tutor externo"
                      onClick={() => {
                        setModalType("tutor")
                        setExternalPersonEmailError(null)
                        setShowExternalModal(true)
                      }}
                    >
                      Registrar Tutor Externo
                    </Button>
                  </div>
                )}
              </div>

              {!isViewMode && (
                <div className="form-group full-width">
                  <label htmlFor="tutorSearch">Buscar integrante tutor</label>
                  <Input
                    id="tutorSearch"
                    name="tutorSearch"
                    type="text"
                    value={tutorSearch.term}
                    onChange={(event) => tutorSearch.setTerm(event.target.value)}
                    placeholder="Escribe para buscar potenciales tutores"
                    aria-label="Campo para buscar tutores"
                  />
                  <small className="form-hint">Agrega tutores oficiales desde el directorio institucional.</small>
                </div>
              )}

              {!isViewMode && (
                <div className="record-list">
                  {tutorSearch.isLoading ? (
                    <p className="empty-state">Buscando tutores...</p>
                  ) : tutorSearch.error ? (
                    <p className="error-message">{tutorSearch.error}</p>
                  ) : tutorSearch.results.length === 0 ? (
                    <p className="empty-state">Escribe al menos 2 caracteres para listar tutores</p>
                  ) : (
                    tutorSearch.results.map((integrant) => (
                      <div key={integrant.id_integrant} className="record-item">
                        <div className="record-item-info">
                          <strong>{integrant.name}</strong>
                          <span>{integrant.email || "Sin correo"}</span>
                          <span>{integrant.work_center || "Sin centro de trabajo"}</span>
                        </div>
                        <Button
                          size="sm"
                          aria-label={`Agregar ${integrant.name} como tutor`}
                          onClick={() => handleSelectIntegrant(integrant, "tutor")}
                        >
                          Agregar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}

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

        </form>
      </Card>

      {isSaved && !isViewMode && !isEditMode && (
        <Card>
          <div className="form-actions">
            {submitError && <p className="error-message">{submitError}</p>}
            <Button type="button" onClick={handleSaveCompleteRecord} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Registro Completo"}
            </Button>
          </div>
        </Card>
      )}

      {isEditMode && (
        <Card>
          <div className="form-actions">
            {submitError && <p className="error-message">{submitError}</p>}
            <Button type="button" variant="secondary" onClick={() => navigate("/records")}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleUpdateRecord()} disabled={isSubmitting}>
              {isSubmitting ? "Actualizando..." : "Actualizar Registro"}
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
              <Button
                type="button"
                onClick={() =>
                  navigate(`/records/${id}/edit`, {
                    state: recordData ? { record: recordData } : undefined,
                  })
                }
              >
                Editar Registro
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
