import { apiClient } from '../api/client';
import type { 
  LoginRequest, 
  RegisterRequest, 
 
  User 
} from '../../types/api/auth';
import type { AxiosResponse } from 'axios';


/**
 * Transforma la respuesta del servidor al modelo de dominio
 */
const transformAuthResponse = (response: AxiosResponse): { token: string } => {
  return {
    token: response.data.access_token,
  };
};

/**
 * Servicio de autenticación
 * Maneja todas las peticiones relacionadas con auth
 */
export const authService = {
  /**
   * Inicia sesión con credenciales
   */
  async login(credentials: LoginRequest): Promise<{  token: string }> {
    console.log(credentials);
    const response = await apiClient.post('/auth/login', {
      'email': credentials.email,
      'password': credentials.password
    });
    console.log(response.data);
    const transformed = transformAuthResponse(response);
    
    // Guardar token en localStorage
    localStorage.setItem('auth_token', transformed.token);
    
    return transformed;
  },

  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterRequest): Promise<{  token: string }> {
    const response = await apiClient.post('/auth/register', data);
    const transformed = transformAuthResponse(response.data);
    
    // Guardar token en localStorage
    localStorage.setItem('auth_token', transformed.token);
   
    
    return transformed;
  },

  /**
   * Cierra la sesión actual
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Limpiar datos locales siempre
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Verifica si el token actual es válido
   */
  async verifyToken(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/auth/verify');
    return {
      ...response.data.user,
      createdAt: new Date(response.data.user.createdAt),
    };
  },

  /**
   * Obtiene el usuario actual desde localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return {
        ...user,
        createdAt: new Date(user.createdAt),
      };
    } catch {
      return null;
    }
  },

  /**
   * Obtiene el token actual desde localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};
