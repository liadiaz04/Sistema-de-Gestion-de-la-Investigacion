// Tipos para las respuestas de la API de roles

// Rol básico (respuesta de GET /roles/)
export interface Role {
  id_role: number;
  role_name: string;
}

// Payload para crear rol
export interface RoleCreate {
  id: number; // id_rol
  role_name: string;
}

// Payload para actualizar rol
export interface RoleUpdate {
  role_name?: string;
}

// Parámetros de filtro para GET /roles/
export interface RoleFilters {
  skip?: number;
  limit?: number;
  search?: string;
}
