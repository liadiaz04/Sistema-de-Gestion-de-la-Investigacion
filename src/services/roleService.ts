import { apiClient } from './api/client';
import type {
  Role,
  RoleCreate,
  RoleUpdate,
  RoleFilters,
} from '../types/api/role';

export const roleService = {
  /**
   * Obtiene todos los roles con filtros opcionales
   */
  async getAllRoles(filters?: RoleFilters): Promise<Role[]> {
    const response = await apiClient.get<Role[]>('/roles/', {
      params: {
        skip: filters?.skip ?? 0,
        limit: filters?.limit ?? 100,
        search: filters?.search,
      },
    });
    return response.data;
  },

  /**
   * Obtiene un rol por su ID
   */
  async getRoleById(roleId: number): Promise<Role> {
    const response = await apiClient.get<Role>(`/roles/${roleId}`);
    return response.data;
  },

  /**
   * Crea un nuevo rol
   */
  async createRole(role: RoleCreate): Promise<Role> {
    const response = await apiClient.post<Role>('/roles/', role);
    return response.data;
  },

  /**
   * Actualiza un rol existente
   */
  async updateRole(roleId: number, role: RoleUpdate): Promise<Role> {
    const response = await apiClient.put<Role>(`/roles/${roleId}`, role);
    return response.data;
  },

  /**
   * Elimina un rol
   */
  async deleteRole(roleId: number): Promise<Role> {
    const response = await apiClient.delete<Role>(`/roles/${roleId}`);
    return response.data;
  },
};

