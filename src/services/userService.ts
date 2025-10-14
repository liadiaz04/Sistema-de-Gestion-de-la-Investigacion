import type { IUser, UserRole } from "../types"
import { mockUsers } from "./mockData"
import { auditService } from "./auditService"

class UserService {
  async getAllUsers(): Promise<IUser[]> {
    return mockUsers
  }

  async updateUserRole(userId: string, newRole: UserRole, currentUser: IUser): Promise<IUser> {
    const user = mockUsers.find((u) => u.id === userId)
    if (!user) throw new Error("Usuario no encontrado")

    const oldRoles = [...user.roles]
    if (!user.roles.includes(newRole)) {
      user.roles.push(newRole)
    }

    await auditService.logAction(
      currentUser,
      "modificar",
      "UserService",
      "PUT",
      `/users/${userId}/roles`,
      200,
      `Rol actualizado para usuario ${user.nombreUsuario}`,
      { oldRoles, newRoles: user.roles },
    )

    return user
  }

  async removeUserRole(userId: string, role: UserRole, currentUser: IUser): Promise<IUser> {
    const user = mockUsers.find((u) => u.id === userId)
    if (!user) throw new Error("Usuario no encontrado")

    const oldRoles = [...user.roles]
    user.roles = user.roles.filter((r) => r !== role)

    await auditService.logAction(
      currentUser,
      "modificar",
      "UserService",
      "DELETE",
      `/users/${userId}/roles/${role}`,
      200,
      `Rol eliminado para usuario ${user.nombreUsuario}`,
      { oldRoles, newRoles: user.roles },
    )

    return user
  }
}

export const userService = new UserService()
