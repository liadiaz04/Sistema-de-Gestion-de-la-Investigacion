import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../../types/api/auth';

// Configuración base del cliente HTTP
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log de la petición
    console.log('🚀 API CALL:', {
      method: config.method?.toUpperCase(),
      endpoint: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      body: config.data,
      params: config.params,
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    // Log de la respuesta exitosa
    console.log('✅ API RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      endpoint: response.config.url,
      method: response.config.method?.toUpperCase(),
      data: response.data,
      headers: response.headers,
    });
    
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Log del error
    console.error('❌ API ERROR:', {
      endpoint: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorData: error.response?.data,
      message: error.message,
    });
    
    // Manejo centralizado de errores
    if (error.response) {
      const { status, data } = error.response;
      
      // Si el token es inválido o expiró, redirigir al login
      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
      
      // Lanzar el mensaje de error del servidor
      const message = data?.message || 'Error en la petición';
      throw new Error(message);
    } else if (error.request) {
      // Error de red
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
    } else {
      // Error desconocido
      throw new Error('Ocurrió un error inesperado');
    }
  }
);
