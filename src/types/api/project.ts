// Tipos para las respuestas de la API de proyectos

// Resumen de integrante (responsable)
export interface IntegrantSummary {
  id_integrant: number;
  name: string;
  email?: string;
}

// Clasificación de proyecto
export interface ProjectClassification {
  id_classification: number;
  name: string;
  code?: string;
}

// Estado de proyecto
export interface ProjectState {
  id_state: number;
  name: string;
}

// Tipo de proyecto
export interface ProjectType {
  id_type: number;
  name: string;
}

// Proyecto básico (respuesta de GET /projects/)
export interface Project {
  id_project: number;
  title: string;
  code?: string | null;
  description?: string | null;
  objectives?: string | null;
  tasks?: string | null;
  scientific_details?: string | null;
  other_data?: string | null;
  council_criteria?: string | null;
  start_date: string;
  end_date?: string | null;
  is_prioritized: boolean;
  is_approved: boolean;
  id_responsible: number;
  responsible?: IntegrantSummary | null;
  id_classification?: number | null;
  classification?: ProjectClassification | null;
  id_state: number;
  state?: ProjectState | null;
  id_type?: number | null;
  type?: ProjectType | null;
  id_group?: number | null;
  group?: {
    id_group: number;
    name: string;
  } | null;
}

// Miembro del proyecto
export interface ProjectMember {
  id_project_member: number;
  id_project: number;
  id_integrant: number;
  integrant?: IntegrantSummary;
  has_administrative_permission: boolean;
  entry_date: string;
}

// Proyecto con miembros (respuesta de GET /projects/{id})
export interface ProjectWithMembers extends Project {
  members?: ProjectMember[];
}

// Payload para crear proyecto
export interface ProjectCreate {
  title: string;
  code?: string | null;
  description?: string | null;
  objectives?: string | null;
  tasks?: string | null;
  scientific_details?: string | null;
  other_data?: string | null;
  council_criteria?: string | null;
  start_date: string;
  end_date?: string | null;
  is_prioritized: boolean;
  is_approved: boolean;
  id_responsible: number;
  id_classification?: number | null;
  id_state: number;
  id_type?: number | null;
  id_group?: number | null;
}

// Payload para actualizar proyecto
export interface ProjectUpdate {
  title?: string;
  code?: string | null;
  description?: string | null;
  objectives?: string | null;
  tasks?: string | null;
  scientific_details?: string | null;
  other_data?: string | null;
  council_criteria?: string | null;
  start_date?: string;
  end_date?: string | null;
  is_prioritized?: boolean;
  is_approved?: boolean;
  id_responsible?: number;
  id_classification?: number | null;
  id_state?: number;
  id_type?: number | null;
  id_group?: number | null;
}

// Parámetros de filtro para GET /projects/
export interface ProjectFilters {
  skip?: number;
  limit?: number;
  responsible_id?: number;
  group_id?: number;
  search?: string;
}

