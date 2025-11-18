import { apiClient } from './api/client';
import type {
  Group,
  GroupCreate,
  GroupUpdate,
  GroupFilters,
} from '../types/api/group';

export interface CreateGroupPayload {
  name: string
  subjects: string
  problems: string
  id_admin: number
  id_faculty: number
  create_date: string
  update_date: string
  member_ids: number[]
  id_faculty_area: number
}

export const groupService = {
  /**
   * Obtiene todos los grupos con filtros opcionales
   */
  async getAllGroups(filters?: GroupFilters): Promise<Group[]> {
    const response = await apiClient.get<Group[]>('/groups/', {
      params: {
        skip: filters?.skip ?? 0,
        limit: filters?.limit ?? 100,
        search: filters?.search,
      },
    });
    return response.data;
  },

  /**
   * Obtiene un grupo por su ID
   */
  async getGroupById(groupId: number): Promise<Group> {
    const response = await apiClient.get<Group>(`/groups/${groupId}`);
    return response.data;
  },

  /**
   * Crea un nuevo grupo
   */
  async createGroup(group: GroupCreate): Promise<Group> {
    const response = await apiClient.post<Group>('/groups/', group);
    return response.data;
  },

  /**
   * Actualiza un grupo existente
   */
  async updateGroup(groupId: number, group: GroupUpdate): Promise<Group> {
    const response = await apiClient.put<Group>(`/groups/${groupId}`, group);
    return response.data;
  },

  /**
   * Elimina un grupo
   */
  async deleteGroup(groupId: number): Promise<Group> {
    const response = await apiClient.delete<Group>(`/groups/${groupId}`);
    return response.data;
  },

  async createGroup(data: CreateGroupPayload) {
    return apiClient.post('/groups/', data)
  },
}
