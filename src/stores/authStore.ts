import { create } from "zustand"
import type { User } from "../types/api/auth"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: ( token: string) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: ( token) => {
    localStorage.setItem("token", token)
    set({  token, isAuthenticated: true })
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
