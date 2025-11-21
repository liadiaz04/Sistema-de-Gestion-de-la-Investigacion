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
import { mockRecords, mockProjects } from "../services/mockData"
import "./RecordForm.css"
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
import {
  validateRequired,
  validateEmail,
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
  descripcion: "",
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
  base.descripcion = record.resume || base.descripcion
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
      base.descripcion = book.chapter_title || base.descripcion
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
  const [associatedProjects, setAssociatedProjects] = useState<any[]>([])
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [modalType, setModalType] = useState<"author" | "tutor">("author")
  const [externalPerson, setExternalPerson] = useState({
    nombre: "",
    apellidos: "",
    numeroIdentidad: "",
    entidad: "",
    email: "",
  })
  const [projectSearch, setProjectSearch] = useState("")

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

  const authorSearch = useIntegrantSearch()
  const tutorSearch = useIntegrantSearch()

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
    setAssociatedProjects([])
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
    setAssociatedProjects([])
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
    setSelectedArticleTypeId(null)
    setSelectedNormTypeId(null)
    setSelectedPrizeTypeId(null)
    setSelectedThesisTypeId(null)
    setSelectedEncounterTypeId(null)
  }, [recordType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode && recordNumericId) {
      const index = mockRecords.findIndex((r) => r.id === recordNumericId)
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

  // Helper para formatear fecha (YYYY-MM-DD)
  const formatDate = (year: number, month: number): string => {
    return `${year}-${String(month).padStart(2, "0")}-01`
  }

  // Helper para convertir string vacío a null
  const toNullIfEmpty = (value: string | null | undefined): string | null => {
    return value && value.trim() ? value.trim() : null
  }

  // Helper para convertir string a boolean
  const toBoolean = (value: string | boolean | undefined): boolean => {
    if (typeof value === "boolean") return value
    if (typeof value === "string") {
      return value === "true" || value === "concedida" || value === "terminado" || value === "registrado"
    }
    return false
  }

  // Función para validar todos los campos antes de enviar
  const validateForm = (): boolean => {
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
        if (formData.doi) {
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
      if (author.usuario?.correoElectronico) {
        const emailError = validateEmail(author.usuario.correoElectronico)
        if (emailError) {
          errors[`externalAuthorEmail_${index}`] = emailError
        }
      }
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveCompleteRecord = async () => {
    // Validar formulario antes de enviar
    if (!validateForm()) {
      setSubmitError("Por favor, corrija los errores en el formulario antes de continuar")
      setShowSuccessDialog(true)
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setFieldErrors({})

      const authorIds = buildAuthorIds()
      const keywords = toNullIfEmpty(formData.palabrasClave)
      const resume = toNullIfEmpty(formData.resumen)
      const onlyDate = formatDate(formData.año, formData.mes)
      const reportDate = new Date().toISOString().split("T")[0]

      switch (recordType) {
        case "articulo": {
          const payload = {
            title: formData.titulo,
            journal: formData.revista,
            voulume: formData.volumen || "",
            pages: formData.paginas || "",
            author_ids: authorIds,
            number: toNullIfEmpty(formData.numero),
            keywords,
            doi: toNullIfEmpty(formData.doi),
            resume,
            id_article_type: selectedArticleTypeId,
            report_date: reportDate,
            issn: toNullIfEmpty(formData.issn),
            id_country: selectedCountryId,
            month_only: formData.mes,
            year_only: formData.año,
            id_project: associatedProjects.length > 0 ? Number(associatedProjects[0].id) : null,
            only_date: onlyDate,
            id_group: null,
            published: true,
          }
          await recordService.createArticle(payload)
          break
        }
        case "libro": {
          const payload = {
            title: formData.titulo,
            chapter_title: formData.descripcion || "",
            author_ids: authorIds,
            editor: formData.editorial || "",
            voulume: formData.volumen || "",
            number: toNullIfEmpty(formData.numero),
            series: null,
            pages: toNullIfEmpty(formData.paginas),
            publisher: formData.editorial || "",
            keywords,
            resume,
            isbn: toNullIfEmpty(formData.isbn),
            report_date: reportDate,
            id_country: selectedCountryId,
            is_chapter: false,
            month_only: formData.mes,
            year_only: formData.año,
            id_project: associatedProjects.length > 0 ? Number(associatedProjects[0].id) : null,
            only_date: onlyDate,
            id_group: null,
          }
          await recordService.createBook(payload)
          break
        }
        case "monografia": {
          const payload = {
            title: formData.titulo,
            isbn: formData.isbn || "",
            pages: formData.paginas || "",
            author_ids: authorIds,
            number: toNullIfEmpty(formData.numero),
            month: toNullIfEmpty(String(formData.mes)),
            keywords,
            resume,
            cenda: formData.registroCENDA || "",
            report_date: reportDate,
            month_only: formData.mes,
            year_only: formData.año,
            id_country: selectedCountryId,
            id_project: associatedProjects.length > 0 ? Number(associatedProjects[0].id) : null,
            only_date: onlyDate,
            id_group: null,
          }
          await recordService.createMonograph(payload)
          break
        }
        case "norma": {
          const payload = {
            title: formData.titulo,
            registration_number: formData.numeroRegistro || "",
            pages: formData.paginas || "",
            author_ids: authorIds,
            keywords,
            resume,
            id_norm_type: selectedNormTypeId,
            report_date: reportDate,
            id_country: selectedCountryId,
            month_only: formData.mes,
            year_only: formData.año,
            id_project: associatedProjects.length > 0 ? Number(associatedProjects[0].id) : null,
            only_date: onlyDate,
            id_group: null,
          }
          await recordService.createNorm(payload)
          break
        }
        case "patente": {
          const payload = {
            title: formData.titulo,
            reg_number: formData.numeroRegistro || "",
            yearfiled: String(formData.año),
            author_ids: authorIds,
            language: null,
            assignee: "",
            monthfield: toNullIfEmpty(String(formData.mes)),
            keywords,
            resume,
            report_date: reportDate,
            month_only: formData.mes,
            year_only: formData.año,
            id_country: selectedCountryId,
            is_conceded: toBoolean(formData.estado),
            id_project: associatedProjects.length > 0 ? Number(associatedProjects[0].id) : null,
            only_date: onlyDate,
            id_group: null,
          }
          await recordService.createPatent(payload)
          break
        }
        case "software": {
          const payload = {
            title: formData.titulo,
            number: formData.registroCENDA || "",
            yearfiled: String(formData.año),
            author_ids: authorIds,
            language: null,
            assignee: "",
            monthfield: toNullIfEmpty(String(formData.mes)),
            keywords,
            resume,
            report_date: reportDate,
            month_only: formData.mes,
            year_only: formData.año,
            id_country: selectedCountryId,
            is_conceded: toBoolean(formData.estado),
            id_project: associatedProjects.length > 0 ? Number(associatedProjects[0].id) : null,
            only_date: onlyDate,
            is_multimedia: false,
            id_group: null,
          }
          await recordService.createSoftware(payload)
          break
        }
        case "evento": {
          const payload = {
            title: formData.titulo,
            encounter_name: formData.nombreEvento || "",
            author_ids: authorIds,
            keywords,
            resume,
            id_encounter_type: selectedEncounterTypeId,
            report_date: reportDate,
            isbn: null,
            city: null,
            issn: null,
            organizer: formData.organizador || "",
            id_country: selectedCountryId,
            month_only: formData.mes,
            year_only: formData.año,
            id_project: associatedProjects.length > 0 ? Number(associatedProjects[0].id) : null,
            only_date: onlyDate,
            id_group: null,
          }
          await recordService.createEvent(payload)
          break
        }
        case "premio": {
          const payload = {
            title: formData.titulo,
            grant_institution: formData.institucion || "",
            author_ids: authorIds,
            keywords,
            resume,
            id_prize_type: selectedPrizeTypeId,
            report_date: reportDate,
            id_country: selectedCountryId,
            month_only: formData.mes,
            year_only: formData.año,
            id_project: associatedProjects.length > 0 ? Number(associatedProjects[0].id) : null,
            only_date: onlyDate,
            id_group: null,
          }
          await recordService.createPrize(payload)
          break
        }
        case "tesis": {
          const payload = {
            title: formData.titulo,
            institution: formData.institucion || "",
            author_ids: authorIds,
            tutor_ids: selectedTutorIds,
            keywords,
            resume,
            id_thesis_type: selectedThesisTypeId,
            report_date: reportDate,
            id_country: selectedCountryId,
            month_only: formData.mes,
            year_only: formData.año,
            id_project: associatedProjects.length > 0 ? Number(associatedProjects[0].id) : null,
            only_date: onlyDate,
            id_group: null,
          }
          await recordService.createThesis(payload)
          break
        }
        default:
          throw new Error("Tipo de registro no válido")
      }

      setSuccessMessage("Registro científico guardado con éxito")
      setShowSuccessDialog(true)
      setTimeout(() => {
        navigate("/records")
      }, 1500)
    } catch (error: any) {
      // Manejar error 409 (conflicto) para ISSN/ISBN/DOI duplicados
      if (isDuplicateIdentifierError(error)) {
        const friendlyMessage = getDuplicateIdentifierMessage(error)
        setSubmitError(friendlyMessage)
        setSuccessMessage(friendlyMessage)
        setShowSuccessDialog(true)
      } else {
        const errorMessage = extractErrorMessage(error) || "Error al guardar el registro"
        setSubmitError(errorMessage)
        setSuccessMessage(errorMessage)
        setShowSuccessDialog(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRecord = () => {
    if (!recordNumericId) return
    const index = mockRecords.findIndex((r) => r.id === recordNumericId)
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
        metadata: {
          countryId: selectedCountryId,
          articleTypeId: selectedArticleTypeId,
          normTypeId: selectedNormTypeId,
          prizeTypeId: selectedPrizeTypeId,
          thesisTypeId: selectedThesisTypeId,
          encounterTypeId: selectedEncounterTypeId,
        },
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
                disabled={isViewMode ? true : false}
              />
              {fieldErrors.doi && <span className="field-error">{fieldErrors.doi}</span>}
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
    { id: "proyectos", label: "Proyectos Asociados" },
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
          <div className="form-group">
            <label>Correo Electrónico</label>
            <Input
              type="email"
              value={externalPerson.email}
              onChange={(e) => setExternalPerson({ ...externalPerson, email: e.target.value })}
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
                    <small className="form-hint">Separe múltiples palabras clave con comas (mínimo 3, máximo 10)</small>
                    {fieldErrors.palabrasClave && <span className="field-error">{fieldErrors.palabrasClave}</span>}
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
                      aria-label="Agregar autor externo"
                      onClick={() => {
                        setModalType("author")
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

              {fieldErrors.authors && <p className="error-message">{fieldErrors.authors}</p>}
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
            <div className="form-section">
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
