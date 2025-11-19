import { apiClient } from './api/client';

// Tipo para crear una traza
export interface TraceCreate {
  id_integrant: number;
  method: string | null;
  date: string | null; // ISO 8601
  route: string | null;
  message: string | null;
  response: string | null;
}

// Tipo para la respuesta de traza
export interface Trace {
  id_trace?: number;
  id_integrant: number;
  method: string | null;
  date: string | null;
  route: string | null;
  message: string | null;
  response: string | null;
  integrant?: {
    id_integrant: number;
    name: string;
    email?: string;
  };
}

// Filtros para obtener trazas
export interface TraceFilters {
  start_date?: string; // ISO 8601
  end_date?: string; // ISO 8601
  skip?: number;
  limit?: number;
}

export const traceService = {
  /**
   * Crea una nueva traza
   */
  async createTrace(trace: TraceCreate): Promise<Trace> {
    try {
      const response = await apiClient.post<Trace>('/traces/', trace);
      return response.data;
    } catch (error) {
      // No lanzar error para no interrumpir el flujo principal
      console.error('Error creando traza:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las trazas con filtros opcionales
   */
  async getAllTraces(filters?: TraceFilters): Promise<Trace[]> {
    const response = await apiClient.get<Trace[]>('/traces/', {
      params: {
        skip: filters?.skip ?? 0,
        limit: filters?.limit ?? 100,
        start_date: filters?.start_date,
        end_date: filters?.end_date,
      },
    });
    return response.data;
  },
};

