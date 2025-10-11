import { create } from "zustand"
import type { IUser } from "../types"

interface AuthState {
  user: IUser | null
  token: string | null
  isAuthenticated: boolean
  login: (user: IUser, token: string) => void
  logout: () => void
  updateUser: (user: IUser) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    set({ user: null, token: null, isAuthenticated: false })
  },
  updateUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user))
    set({ user })
  },
}))

// Initialize auth state from localStorage
const token = localStorage.getItem("token")
const userStr = localStorage.getItem("user")
if (token && userStr) {
  try {
    const user = JSON.parse(userStr)
    useAuthStore.setState({ user, token, isAuthenticated: true })
  } catch (error) {
    console.error("Error parsing user from localStorage:", error)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }
}
