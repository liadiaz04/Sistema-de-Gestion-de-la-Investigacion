import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiError } from '../../types/api/auth';

// Función para registrar trazas de forma asíncrona sin bloquear
const registerTrace = async (traceData: {
  id_integrant: number;
  method: string | null;
  date: string;
  route: string | null;
  message: string | null;
  response: string | null;
}) => {
  try {
    // Importar dinámicamente para evitar dependencia circular
    const { traceService } = await import('../traceService');
    await traceService.createTrace(traceData);
  } catch (error) {
    // Silenciar errores de trazas para no interrumpir el flujo principal
    console.warn('Error registrando traza:', error);
  }
};

// Configuración base del cliente HTTP
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
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
  async (response: AxiosResponse) => {
    // Log de la respuesta exitosa
    console.log('✅ API RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      endpoint: response.config.url,
      method: response.config.method?.toUpperCase(),
      data: response.data,
      headers: response.headers,
    });
    
    // Registrar traza de forma asíncrona (no bloquear el flujo)
    const userId = localStorage.getItem('user_id');
    if (userId && response.config.url) {
      // No registrar trazas de las propias peticiones de trazas para evitar loops
      if (!response.config.url.includes('/traces/')) {
        const method = response.config.method?.toUpperCase() || null;
        const route = response.config.url || null;
        const date = new Date().toISOString();
        const message = `Request successful: ${method} ${route}`;
        const responseData = JSON.stringify(response.data).substring(0, 500); // Limitar tamaño
        
        // Registrar de forma asíncrona sin esperar
        registerTrace({
          id_integrant: parseInt(userId),
          method,
          date,
          route,
          message,
          response: response.status.toString(),
        }).catch(() => {
          // Error ya manejado en registerTrace
        });
      }
    }
    
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Log del error
    console.error('❌ API ERROR:', {
      endpoint: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorData: error.response?.data,
      message: error.message,
    });
    
    // Registrar traza del error de forma asíncrona (no bloquear el flujo)
    const userId = localStorage.getItem('user_id');
    if (userId && error.config?.url) {
      // No registrar trazas de las propias peticiones de trazas para evitar loops
      if (!error.config.url.includes('/traces/')) {
        const method = error.config.method?.toUpperCase() || null;
        const route = error.config.url || null;
        const date = new Date().toISOString();
        const status = error.response?.status || null;
        const message = `Request failed: ${method} ${route} - Status: ${status || 'Network Error'}`;
        const errorData = error.response?.data 
          ? JSON.stringify(error.response.data).substring(0, 500)
          : error.message.substring(0, 500);
        
        // Registrar de forma asíncrona sin esperar
        registerTrace({
          id_integrant: parseInt(userId),
          method,
          date,
          route,
          message,
          response: errorData,
        }).catch(() => {
          // Error ya manejado en registerTrace
        });
      }
    }
    
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
