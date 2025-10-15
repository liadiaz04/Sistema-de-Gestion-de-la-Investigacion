import type { IUser, IGroup, IProject, IArticle } from "../types"

// Mock Users
export const mockUsers: IUser[] = [
  {
    id: "1",
    nombre: "Juan",
    apellidos: "Pérez García",
    numeroIdentidad: "85010112345",
    correoElectronico: "juan.perez@cujae.edu.cu",
    nombreUsuario: "jperez",
    roles: ["admin", "responsable_grupo", "autor_registro"],
    categoriaDocente: "titular",
    categoriaCientifica: "doctor",
    clasificacionGeneral: "profesor",
    facultad: "Informática",
    departamento: "Ingeniería de Software",
    esExterno: false,
    esAdministrador: true,
    telefono: "+53 7 266 3333",
    pais: "Cuba",
  },
  {
    id: "2",
    nombre: "María",
    apellidos: "González López",
    numeroIdentidad: "90050298765",
    correoElectronico: "maria.gonzalez@cujae.edu.cu",
    nombreUsuario: "mgonzalez",
    roles: ["responsable_proyecto", "autor_registro"],
    categoriaDocente: "asistente",
    categoriaCientifica: "master",
    clasificacionGeneral: "profesor",
    estadoSuperacion: "doctorante",
    facultad: "Civil",
    departamento: "Construcciones",
    esExterno: false,
    esAdministrador: false,
    telefono: "+53 7 266 4444",
    pais: "Cuba",
  },
  {
    id: "3",
    nombre: "Carlos",
    apellidos: "Rodríguez Martínez",
    numeroIdentidad: "88030345678",
    correoElectronico: "carlos.rodriguez@cujae.edu.cu",
    nombreUsuario: "crodriguez",
    roles: ["integrante_proyecto", "autor_registro"],
    categoriaDocente: "instructor",
    clasificacionGeneral: "profesor",
    facultad: "Mecánica",
    departamento: "Ingeniería Mecánica",
    esExterno: false,
    esAdministrador: false,
    pais: "Cuba",
  },
]

// Mock Groups
export const mockGroups: IGroup[] = [
  {
    id: "1",
    nombre: "Grupo de Inteligencia Artificial",
    descripcion: "Investigación en machine learning y deep learning aplicado a problemas de ingeniería",
    responsable: mockUsers[0],
    tematicas: ["Machine Learning", "Deep Learning", "Computer Vision"],
    facultad: "Informática",
    departamento: "Ingeniería de Software",
    fechaCreacion: "2020-01-15",
    fechaActualizacion: "2024-12-10",
    totalIntegrantes: 8,
  },
  {
    id: "2",
    nombre: "Grupo de Estructuras y Materiales",
    descripcion: "Estudio de materiales de construcción y análisis estructural",
    responsable: mockUsers[1],
    tematicas: ["Materiales de Construcción", "Análisis Estructural", "Sostenibilidad"],
    facultad: "Civil",
    departamento: "Construcciones",
    fechaCreacion: "2019-09-01",
    fechaActualizacion: "2024-11-20",
    totalIntegrantes: 12,
  },
]

export const mockGroupMembers: Record<string, any[]> = {
  "1": [
    {
      id: "gm1",
      usuario: mockUsers[0],
      rol: "responsable_grupo",
      evaluacion: "excelente",
      descripcionEvaluacion: "Excelente liderazgo y coordinación del grupo",
      cargo: "Responsable",
      dedicacion: "Tiempo completo",
      fechaIngreso: "2020-01-15",
    },
    {
      id: "gm2",
      usuario: mockUsers[2],
      rol: "integrante_grupo",
      evaluacion: "bien",
      descripcionEvaluacion: "Buen desempeño en las investigaciones",
      cargo: "Investigador",
      dedicacion: "Medio tiempo",
      fechaIngreso: "2021-03-10",
    },
  ],
  "2": [
    {
      id: "gm3",
      usuario: mockUsers[1],
      rol: "responsable_grupo",
      evaluacion: "excelente",
      descripcionEvaluacion: "Excelente gestión del grupo",
      cargo: "Responsable",
      dedicacion: "Tiempo completo",
      fechaIngreso: "2019-09-01",
    },
  ],
}

export const mockGroupProjects: Record<string, string[]> = {
  "1": ["1"], // Grupo IA tiene proyecto de reconocimiento facial
  "2": ["2"], // Grupo Estructuras tiene proyecto de hormigón
}

export const mockGroupRecords: Record<string, string[]> = {
  "1": ["1"], // Grupo IA tiene artículo de deep learning
  "2": [],
}

// Mock Projects
export const mockProjects: IProject[] = [
  {
    id: "1",
    nombre: "Sistema de Reconocimiento Facial para Control de Acceso",
    descripcion: "Desarrollo de un sistema de reconocimiento facial utilizando redes neuronales convolucionales",
    responsable: mockUsers[0],
    tematica: "Inteligencia Artificial",
    programa: "Programa Nacional de Informatización",
    esPriorizado: true,
    estaAprobado: true,
    estado: "activo",
    fechaInicio: "2023-01-01",
    objetivos: "Desarrollar un sistema robusto de reconocimiento facial",
    tareas: "Recolección de datos, entrenamiento de modelos, implementación",
  },
  {
    id: "2",
    nombre: "Análisis de Hormigón Reforzado con Fibras Naturales",
    descripcion: "Investigación sobre el uso de fibras naturales en hormigón para mejorar propiedades mecánicas",
    responsable: mockUsers[1],
    tematica: "Materiales de Construcción",
    programa: "Programa de Construcción Sostenible",
    esPriorizado: false,
    estaAprobado: true,
    estado: "activo",
    fechaInicio: "2023-06-01",
    objetivos: "Evaluar propiedades mecánicas del hormigón con fibras naturales",
    tareas: "Preparación de muestras, ensayos de laboratorio, análisis de resultados",
  },
]

// Mock Records
export const mockRecords: IArticle[] = [
  {
    id: "1",
    tipo: "articulo",
    titulo: "Deep Learning for Facial Recognition in Low-Light Conditions",
    descripcion:
      "Artículo sobre técnicas de deep learning para reconocimiento facial en condiciones de baja iluminación",
    autores: [
      {
        id: "a1",
        usuario: mockUsers[0],
        nombre: "Juan",
        apellidos: "Pérez García",
        esExterno: false,
        esPrincipal: true,
        orden: 1,
      },
    ],
    año: 2024,
    mes: 3,
    fechaReporte: "2024-03-15",
    revista: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
    baseDatos: "IEEE Xplore",
    issn: "0162-8828",
    volumen: "46",
    numero: "3",
    paginas: "1234-1245",
    doi: "10.1109/TPAMI.2024.1234567",
    resumen:
      "Este artículo presenta un nuevo enfoque para el reconocimiento facial en condiciones de baja iluminación...",
    palabrasClave: ["Deep Learning", "Facial Recognition", "Low-Light", "Computer Vision"],
    pais: "Cuba",
  },
]

export const mockDashboardSummary = {
  misRegistros: 15,
  misProyectos: 3,
  misGrupos: 2,
  registrosPendientes: 5,
  proyectosActivos: 2,
  gruposActivos: 2,
}
