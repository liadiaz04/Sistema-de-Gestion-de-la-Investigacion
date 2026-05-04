import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { getMessageFromResponseData } from './client';
import { logHttpRequest, logHttpResponseError, logHttpResponseOk } from '../../utils/httpConsoleLogger';
import { print } from '../../utils/print';

// Función para registrar trazas de forma asíncrona sin bloquear
const registerTrace = async (traceData: {
  id_integrant: number;
  method: string | null;
  date: string;
  route: string | null;
  message: string | null;
  response: number | null;
}) => {
  try {
    // Importar dinámicamente para evitar dependencia circular
    const { traceService } = await import('../traceService');
    await traceService.createTrace(traceData);
  } catch (error) {
    // Silenciar errores de trazas para no interrumpir el flujo principal
    print('Error registrando traza:', error);
  }
};

// Cliente HTTP exclusivo para Chat API
export const chatApiClient = axios.create({
  baseURL: 'http://127.0.0.1:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
chatApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logHttpRequest('Chat API', config);

    return config;
  },
  (error) => {
    print('❌ CHAT API REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
chatApiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    logHttpResponseOk('Chat API', response);

    // Registrar traza de forma asíncrona (no bloquear el flujo)
    const userId = localStorage.getItem('user_id');
    if (userId && response.config.url) {
      // No registrar trazas de las propias peticiones de trazas para evitar loops
      if (!response.config.url.includes('/traces/')) {
        const method = response.config.method?.toUpperCase() || null;
        const route = response.config.url || null;
        const date = new Date().toISOString();
        const message = `Chat request successful: ${method} ${route}`;
        
        // Registrar de forma asíncrona sin esperar
        registerTrace({
          id_integrant: parseInt(userId),
          method,
          date,
          route,
          message,
          response: response.status,
        }).catch(() => {
          // Error ya manejado en registerTrace
        });
      }
    }
    
    return response;
  },
  async (error: AxiosError) => {
    logHttpResponseError('Chat API', error);

    // Registrar traza del error de forma asíncrona (no bloquear el flujo)
    const userId = localStorage.getItem('user_id');
    if (userId && error.config?.url) {
      // No registrar trazas de las propias peticiones de trazas para evitar loops
      if (!error.config.url.includes('/traces/')) {
        const method = error.config.method?.toUpperCase() || null;
        const route = error.config.url || null;
        const date = new Date().toISOString();
        const status = error.response?.status || null;
        const message = `Chat request failed: ${method} ${route} - Status: ${status || 'Network Error'}`;

        // Registrar de forma asíncrona sin esperar
        registerTrace({
          id_integrant: parseInt(userId),
          method,
          date,
          route,
          message,
          response: typeof status === 'number' ? status : null,
        }).catch(() => {
          // Error ya manejado en registerTrace
        });
      }
    }
    
    // Manejo centralizado de errores
    if (error.response) {
      const { data } = error.response;
      const message = getMessageFromResponseData(data);
      throw new Error(message);
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor de chat. Verifica tu conexión.');
    } else {
      throw new Error('Ocurrió un error inesperado en el chat');
    }
  }
);

