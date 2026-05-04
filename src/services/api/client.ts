import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiError } from '../../types/api/auth';
import { logHttpRequest, logHttpResponseError, logHttpResponseOk } from '../../utils/httpConsoleLogger';
import { print } from '../../utils/print';

/** Mensaje legible desde respuestas FastAPI (`detail`) u otros formatos. */
export const getMessageFromResponseData = (data: unknown): string => {
  if (data == null || typeof data !== 'object') return 'Error en la petición';
  const d = data as Record<string, unknown>;
  if (typeof d.message === 'string' && d.message.trim()) return d.message;
  const detail = d.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (typeof item === 'object' && item !== null && 'msg' in item) {
        return String((item as { msg?: string }).msg ?? JSON.stringify(item));
      }
      return typeof item === 'string' ? item : JSON.stringify(item);
    });
    return parts.join('; ') || 'Error en la petición';
  }
  return 'Error en la petición';
};

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

    logHttpRequest('API principal', config);

    return config;
  },
  (error) => {
    print('❌ API REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    logHttpResponseOk('API principal', response);

    // Registrar traza de forma asíncrona (no bloquear el flujo)
    const userId = localStorage.getItem('user_id');
    if (userId && response.config.url) {
      // No registrar trazas de las propias peticiones de trazas para evitar loops
      if (!response.config.url.includes('/traces/')) {
        const method = response.config.method?.toUpperCase() || null;
        const route = response.config.url || null;
        const date = new Date().toISOString();
        const message = `Request successful: ${method} ${route}`;

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
  async (error: AxiosError<ApiError>) => {
    logHttpResponseError('API principal', error);

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
      const { status, data } = error.response;
      
      // Si el token es inválido o expiró, redirigir al login
      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
      
      // Lanzar el mensaje de error del servidor
      const message = getMessageFromResponseData(data);
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

if (import.meta.env.DEV) {
  print(
    "%c[HTTP]%c Cliente axios listo: peticiones/respuestas visibles aquí (print → consola).",
    "font-weight:bold;color:#06c;",
    "",
  );
}
