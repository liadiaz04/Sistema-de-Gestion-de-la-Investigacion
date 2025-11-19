import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

/**
 * Hook para gestionar permisos basados en roles
 * Roles del backend: ADMIN (id:1), USUARIO (id:2), CONSEJO (id:3), AUTOR (id:4)
 */
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = (role: UserRole): boolean => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  };

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  };

  /**
   * Verifica si el usuario tiene todos los roles especificados
   */
  const hasAllRoles = (roles: UserRole[]): boolean => {
    if (!user?.roles) return false;
    return roles.every(role => user.roles.includes(role));
  };

  /**
   * Verifica si el usuario es administrador
   */
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  /**
   * Verifica si el usuario es integrante/usuario (solo lectura, no puede crear)
   */
  const isIntegrant = (): boolean => {
    return hasRole('integrant') && !isAdmin() && !isConsejo() && !isAutor();
  };

  /**
   * Verifica si el usuario es consejo
   */
  const isConsejo = (): boolean => {
    return hasRole('consejo');
  };

  /**
   * Verifica si el usuario es autor (puede crear registros)
   */
  const isAutor = (): boolean => {
    return hasRole('autor_registro');
  };

  /**
   * Verifica si el usuario puede crear registros
   * USUARIO (integrant) no puede crear, AUTOR, CONSEJO y ADMIN sí
   */
  const canCreateRecords = (): boolean => {
    return isAdmin() || isConsejo() || isAutor();
  };

  /**
   * Verifica si el usuario puede crear grupos
   * INTEGRANT no puede crear, CONSEJO y ADMIN sí
   */
  const canCreateGroups = (): boolean => {
    return isAdmin() || isConsejo();
  };

  /**
   * Verifica si el usuario puede crear proyectos
   * INTEGRANT no puede crear, CONSEJO y ADMIN sí
   */
  const canCreateProjects = (): boolean => {
    return isAdmin() || isConsejo();
  };

  /**
   * Verifica si el usuario puede modificar/eliminar todos los grupos
   * CONSEJO y ADMIN pueden modificar/eliminar todos
   */
  const canManageAllGroups = (): boolean => {
    return isAdmin() || isConsejo();
  };

  /**
   * Verifica si el usuario puede modificar/eliminar todos los proyectos
   * CONSEJO y ADMIN pueden modificar/eliminar todos
   */
  const canManageAllProjects = (): boolean => {
    return isAdmin() || isConsejo();
  };

  /**
   * Verifica si el usuario puede gestionar proyectos (como responsable)
   */
  const canManageProjects = (): boolean => {
    return isAdmin() || isConsejo() || hasRole('responsable_proyecto');
  };

  /**
   * Verifica si el usuario puede gestionar grupos (como responsable)
   */
  const canManageGroups = (): boolean => {
    return isAdmin() || isConsejo() || hasRole('responsable_grupo');
  };

  /**
   * Verifica si el usuario puede ver estadísticas
   * CONSEJO y ADMIN pueden ver estadísticas
   */
  const canViewStatistics = (): boolean => {
    return isAdmin() || isConsejo();
  };

  /**
   * Verifica si el usuario puede gestionar usuarios
   * Solo ADMIN puede gestionar usuarios
   */
  const canManageUsers = (): boolean => {
    return isAdmin();
  };

  /**
   * Verifica si el usuario puede ver bitácora/auditoría
   * Solo ADMIN puede ver trazas
   */
  const canViewAuditLog = (): boolean => {
    return isAdmin();
  };

  /**
   * Verifica si el usuario puede modificar un registro
   * AUTOR puede modificar solo si es autor del registro
   * CONSEJO y ADMIN pueden modificar todos
   * USUARIO (integrant) no puede modificar
   */
  const canModifyRecord = (isAuthor: boolean): boolean => {
    if (isAdmin() || isConsejo()) return true;
    if (isAutor() && isAuthor) return true;
    if (isIntegrant() && isAuthor) return true; // Por compatibilidad
    return false;
  };

  /**
   * Verifica si el usuario puede eliminar un registro
   * AUTOR puede eliminar solo si es autor del registro
   * CONSEJO y ADMIN pueden eliminar todos
   * USUARIO (integrant) no puede eliminar
   */
  const canDeleteRecord = (isAuthor: boolean): boolean => {
    if (isAdmin() || isConsejo()) return true;
    if (isAutor() && isAuthor) return true;
    if (isIntegrant() && isAuthor) return true; // Por compatibilidad
    return false;
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isIntegrant,
    isConsejo,
    isAutor,
    canCreateRecords,
    canCreateGroups,
    canCreateProjects,
    canManageAllGroups,
    canManageAllProjects,
    canManageProjects,
    canManageGroups,
    canViewStatistics,
    canManageUsers,
    canViewAuditLog,
    canModifyRecord,
    canDeleteRecord,
  };
};
