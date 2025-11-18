import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

/**
 * Hook para gestionar permisos basados en roles
 */
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = (role: UserRole): boolean => {
    return user?.roles?.includes(role) || false;
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
   * Verifica si el usuario puede gestionar proyectos
   */
  const canManageProjects = (): boolean => {
    return hasAnyRole(['admin', 'responsable_proyecto']);
  };

  /**
   * Verifica si el usuario puede gestionar grupos
   */
  const canManageGroups = (): boolean => {
    return hasAnyRole(['admin', 'responsable_grupo']);
  };

  /**
   * Verifica si el usuario puede crear registros
   */
  const canCreateRecords = (): boolean => {
    return hasAnyRole(['admin', 'autor_registro']);
  };

  /**
   * Verifica si el usuario puede ver estadísticas
   */
  const canViewStatistics = (): boolean => {
    return hasAnyRole(['admin', 'consejo_cientifico']);
  };

  /**
   * Verifica si el usuario puede gestionar usuarios
   */
  const canManageUsers = (): boolean => {
    return isAdmin();
  };

  /**
   * Verifica si el usuario puede ver bitácora/auditoría
   */
  const canViewAuditLog = (): boolean => {
    return isAdmin();
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    canManageProjects,
    canManageGroups,
    canCreateRecords,
    canViewStatistics,
    canManageUsers,
    canViewAuditLog,
  };
};
