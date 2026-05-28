import type { IUser, UserRole } from "../types"
import { integrantService } from "./integrantService"
import { roleService } from "./roleService"
import type { IntegrantWithRoles } from "../types/api/integrant"

// Mapeo de role_name del backend a UserRole del frontend
// Backend roles: ADMIN (id:1), USUARIO (id:2), CONSEJO (id:3), AUTOR (id:4)
const mapRoleToUserRole = (role: { id_role: number; role_name: string }): UserRole => {
  const roleName = role.role_name.toUpperCase();
  const normalized = role.role_name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  
  // Mapear según los IDs primero (más confiable)
  if (role.id_role === 1 || roleName === 'ADMIN') return 'admin';
  if (role.id_role === 2 || roleName === 'USUARIO') return 'integrant';
  if (role.id_role === 3 || roleName === 'CONSEJO') return 'consejo';

  if (role.id_role === 4 || roleName === 'AUTOR') return 'autor_registro';
  if (roleName === 'PUBLICADOR') return 'publicador';
  // Mapeo por nombre para roles adicionales
  const roleMap: Record<string, UserRole> = {
    'responsable_proyecto': 'responsable_proyecto',
    'responsable_grupo': 'responsable_grupo',
    'integrante_proyecto': 'integrante_proyecto',
    'integrante_grupo': 'integrante_grupo',
    'consejo_cientifico': 'consejo',
    'autor_registro': 'autor_registro',
    'publicador': 'publicador',
    'usuario': 'usuario',
  }
  
  return roleMap[normalized] || 'usuario'
}

// Mapeo inverso: de UserRole del frontend a role_name del backend
const mapUserRoleToRoleName = (userRole: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    'admin': 'ADMIN',
    'integrant': 'USUARIO', // id:2
    'consejo': 'CONSEJO',
    'autor_registro': 'AUTOR', // id:4
    'publicador': 'PUBLICADOR',
    'responsable_proyecto': 'responsable_proyecto',
    'responsable_grupo': 'responsable_grupo',
    'integrante_proyecto': 'integrante_proyecto',
    'integrante_grupo': 'integrante_grupo',
    'consejo_cientifico': 'CONSEJO',
    'usuario': 'USUARIO',
  }
  return roleMap[userRole] || 'USUARIO'
}

// Función para mapear IntegrantWithRoles a IUser
const mapIntegrantToIUser = (integrant: IntegrantWithRoles): IUser => {
  const nameParts = integrant.name.split(' ')
  const nombre = nameParts[0] || ''
  const apellidos = nameParts.slice(1).join(' ') || ''

  const roles: UserRole[] = integrant.roles
    ? integrant.roles.map(r => mapRoleToUserRole(r))
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
   * Agrega un rol a un usuario sin reemplazar los existentes.
   */
  async modifyUserRole(userId: string, newRole: UserRole, _currentUser: IUser): Promise<IUser> {
    if (newRole === 'admin') {
      throw new Error('El rol admin no puede asignarse por esta vía')
    }

    const allRoles = await roleService.getAllRoles()
    const roleToAdd = allRoles.find((r) => mapRoleToUserRole(r) === newRole)

    if (!roleToAdd) {
      throw new Error(`Rol ${newRole} no encontrado en el backend`)
    }

    const integrant = await integrantService.getIntegrantById(parseInt(userId))
    const currentRoleIds = integrant.roles?.map((r) => r.id_role) ?? []
    console.log('[userService] Estado actual de roles', {
      userId,
      currentRoleIds,
      currentRoles: integrant.roles?.map((r) => ({ id: r.id_role, name: r.role_name })) ?? [],
      roleToAdd: { id: roleToAdd.id_role, name: roleToAdd.role_name, mapped: newRole },
    })

    if (!currentRoleIds.includes(roleToAdd.id_role)) {
      const updatedRoleIds = [...new Set([...currentRoleIds, roleToAdd.id_role])]
      console.log('[userService] Actualizando lista de roles (agregar)', {
        userId,
        method: 'PUT',
        url: `/integrants/${userId}`,
        body: { roles_list: updatedRoleIds },
      })
      await integrantService.updateIntegrantRoles(parseInt(userId), updatedRoleIds)
    } else {
      console.log('[userService] Rol ya existente, no se envía actualización', {
        userId,
        role: newRole,
      })
    }

    return await this.getUserById(userId)
  }

  /**
   * Elimina un rol de un usuario
   */
  async removeUserRole(userId: string, role: UserRole, _currentUser: IUser): Promise<IUser> {
    // Obtener todos los roles disponibles
    const allRoles = await roleService.getAllRoles()
    
    // Buscar el rol por mapeo (ID o nombre)
    const roleToRemove = allRoles.find(r => {
      const mappedRole = mapRoleToUserRole(r)
      return mappedRole === role
    })
    
    if (!roleToRemove) {
      throw new Error(`Rol ${role} no encontrado en el backend`)
    }

    // Obtener el usuario actual
    const integrant = await integrantService.getIntegrantById(parseInt(userId))

    // Construir la nueva lista de role_ids sin el rol a eliminar
    const currentRoleIds = integrant.roles?.map(r => r.id_role) ?? []
    const updatedRoleIds = currentRoleIds.filter(id => id !== roleToRemove.id_role)
    console.log('[userService] Actualizando lista de roles (eliminar)', {
      userId,
      roleToRemove: { id: roleToRemove.id_role, mapped: role },
      currentRoleIds,
      method: 'PUT',
      url: `/integrants/${userId}`,
      body: { roles_list: updatedRoleIds },
    })

    // Actualizar el integrante con la nueva lista de roles
    await integrantService.updateIntegrantRoles(parseInt(userId), updatedRoleIds)

    // Recargar el usuario actualizado
    return await this.getUserById(userId)
  }
}

export const userService = new UserService()
