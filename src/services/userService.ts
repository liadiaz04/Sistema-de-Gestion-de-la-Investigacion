import type { IUser, UserRole } from "../types"
import { integrantService } from "./integrantService"
import { roleService } from "./roleService"
import type { IntegrantWithRoles } from "../types/api/integrant"

// Mapeo de role_name del backend a UserRole del frontend
const mapRoleNameToUserRole = (roleName: string): UserRole => {
  const roleMap: Record<string, UserRole> = {
    'admin': 'admin',
    'responsable_proyecto': 'responsable_proyecto',
    'responsable_grupo': 'responsable_grupo',
    'integrante_proyecto': 'integrante_proyecto',
    'integrante_grupo': 'integrante_grupo',
    'consejo_cientifico': 'consejo_cientifico',
    'autor_registro': 'autor_registro',
    'usuario': 'usuario',
  }
  return roleMap[roleName.toLowerCase()] || 'usuario'
}

// Función para mapear IntegrantWithRoles a IUser
const mapIntegrantToIUser = (integrant: IntegrantWithRoles): IUser => {
  const nameParts = integrant.name.split(' ')
  const nombre = nameParts[0] || ''
  const apellidos = nameParts.slice(1).join(' ') || ''

  const roles: UserRole[] = integrant.roles
    ? integrant.roles.map(r => mapRoleNameToUserRole(r.role_name))
    : []

  return {
    id: integrant.id_integrant.toString(),
    nombre,
    apellidos,
    numeroIdentidad: integrant.identity || '',
    correoElectronico: integrant.email || '',
    nombreUsuario: integrant.email?.split('@')[0] || '', // Usar email como nombre de usuario si no hay campo específico
    roles,
    esExterno: integrant.external,
    esAdministrador: roles.includes('admin'),
    telefono: integrant.phone || undefined,
    lugarTrabajo: integrant.work_center || undefined,
    fondoTiempo: integrant.available_time?.toString() || undefined,
    pais: integrant.country?.name || undefined,
    curriculum: integrant.curriculum || undefined,
    facultad: integrant.faculty?.name || undefined,
    area: integrant.faculty_area?.name || undefined,
    // Campos que no están en el modelo del backend pero están en IUser
    categoriaDocente: undefined,
    categoriaCientifica: integrant.cientific_degree?.name as any,
    clasificacionGeneral: integrant.general_category?.name as any,
    estadoSuperacion: undefined,
    departamento: undefined,
  }
}

class UserService {
  /**
   * Obtiene todos los usuarios (integrantes)
   */
  async getAllUsers(): Promise<IUser[]> {
    const integrants = await integrantService.getAllIntegrants({ limit: 1000 })
    return integrants.map(mapIntegrantToIUser)
  }

  /**
   * Obtiene un usuario por su ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const integrant = await integrantService.getIntegrantById(parseInt(userId))
    return mapIntegrantToIUser(integrant)
  }

  /**
   * Actualiza el rol de un usuario
   * Nota: Esto requiere agregar/eliminar roles a través de endpoints específicos del backend
   * Por ahora, asumimos que el backend tiene endpoints para esto
   */
  async updateUserRole(userId: string, newRole: UserRole, currentUser: IUser): Promise<IUser> {
    // Primero, obtener todos los roles disponibles
    const allRoles = await roleService.getAllRoles()
    
    // Buscar el rol por nombre
    const roleToAdd = allRoles.find(r => 
      mapRoleNameToUserRole(r.role_name) === newRole
    )
    
    if (!roleToAdd) {
      throw new Error(`Rol ${newRole} no encontrado en el backend`)
    }

    // Obtener el usuario actual
    const integrant = await integrantService.getIntegrantById(parseInt(userId))
    
    // Verificar si el usuario ya tiene ese rol
    const hasRole = integrant.roles?.some(r => r.id_role === roleToAdd.id_role)
    if (hasRole) {
      throw new Error('El usuario ya tiene este rol')
    }

    // Construir la nueva lista de role_ids
    const currentRoleIds = integrant.roles?.map(r => r.id_role) ?? []
    const updatedRoleIds = [...currentRoleIds, roleToAdd.id_role]

    // Actualizar el integrante con la nueva lista de roles
    await integrantService.updateIntegrantRoles(parseInt(userId), updatedRoleIds)

    // Recargar el usuario actualizado
    return await this.getUserById(userId)
  }

  /**
   * Elimina un rol de un usuario
   */
  async removeUserRole(userId: string, role: UserRole, currentUser: IUser): Promise<IUser> {
    // Obtener todos los roles disponibles
    const allRoles = await roleService.getAllRoles()
    
    // Buscar el rol por nombre
    const roleToRemove = allRoles.find(r => 
      mapRoleNameToUserRole(r.role_name) === role
    )
    
    if (!roleToRemove) {
      throw new Error(`Rol ${role} no encontrado en el backend`)
    }

    // Obtener el usuario actual
    const integrant = await integrantService.getIntegrantById(parseInt(userId))

    // Construir la nueva lista de role_ids sin el rol a eliminar
    const currentRoleIds = integrant.roles?.map(r => r.id_role) ?? []
    const updatedRoleIds = currentRoleIds.filter(id => id !== roleToRemove.id_role)

    // Actualizar el integrante con la nueva lista de roles
    await integrantService.updateIntegrantRoles(parseInt(userId), updatedRoleIds)

    // Recargar el usuario actualizado
    return await this.getUserById(userId)
  }
}

export const userService = new UserService()
