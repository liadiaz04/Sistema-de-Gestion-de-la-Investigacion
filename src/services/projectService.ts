import { apiClient } from './api/client';
import type {
  Project,
  ProjectWithMembers,
  ProjectCreate,
  ProjectUpdate,
  ProjectFilters,
  ProjectClassification,
  ProjectState,
  ProjectType,
} from '../types/api/project';

export const projectService = {
  /**
   * Obtiene todos los proyectos con filtros opcionales
   */
  async getAllProjects(filters?: ProjectFilters): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects/', {
      params: {
        skip: filters?.skip ?? 0,
        limit: filters?.limit ?? 100,
        responsible_id: filters?.responsible_id,
        group_id: filters?.group_id,
        search: filters?.search,
      },
    });
    return response.data;
  },

  /**
   * Obtiene un proyecto por su ID (con miembros)
   */
  async getProjectById(projectId: number): Promise<ProjectWithMembers> {
    const response = await apiClient.get<ProjectWithMembers>(`/projects/${projectId}`);
    return response.data;
  },

  /**
   * Crea un nuevo proyecto
   */
  async createProject(project: ProjectCreate): Promise<Project> {
    const response = await apiClient.post<Project>('/projects/', project);
    return response.data;
  },

  /**
   * Actualiza un proyecto existente
   */
  async updateProject(projectId: number, project: ProjectUpdate): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${projectId}`, project);
    return response.data;
  },

  /**
   * Elimina un proyecto
   */
  async deleteProject(projectId: number): Promise<Project> {
    const response = await apiClient.delete<Project>(`/projects/${projectId}`);
    return response.data;
  },

  /**
   * Obtiene todas las clasificaciones de proyectos
   */
  async getProjectClassifications(search?: string): Promise<ProjectClassification[]> {
    const response = await apiClient.get<ProjectClassification[]>('/project-classifications/', {
      params: {
        search,
        limit: 100,
      },
    });
    return response.data;
  },

  /**
   * Obtiene todos los estados de proyectos
   */
  async getProjectStates(search?: string): Promise<ProjectState[]> {
    const response = await apiClient.get<ProjectState[]>('/project-states/', {
      params: {
        search,
        limit: 100,
      },
    });
    return response.data;
  },

  /**
   * Obtiene todos los tipos de proyectos
   */
  async getProjectTypes(search?: string): Promise<ProjectType[]> {
    const response = await apiClient.get<ProjectType[]>('/project-types/', {
      params: {
        search,
        limit: 100,
      },
    });
    return response.data;
  },
};

