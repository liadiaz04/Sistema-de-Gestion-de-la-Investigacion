import { apiClient } from "./api/client"
import type {
  IntegrantGroupEvaluation,
  IntegrantGroupEvaluationCreate,
} from "../types/api/integrantGroupEvaluation"

export const integrantGroupEvaluationService = {
  async getByFilters(params: {
    id_group?: number
    id_integrant?: number
    id_evaluation?: number
    skip?: number
    limit?: number
  }): Promise<IntegrantGroupEvaluation[]> {
    const response = await apiClient.get<IntegrantGroupEvaluation[]>("/integrant-group-evaluations/", {
      params: {
        id_group: params.id_group,
        id_integrant: params.id_integrant,
        id_evaluation: params.id_evaluation,
        skip: params.skip ?? 0,
        limit: params.limit ?? 200,
      },
    })
    return response.data
  },

  async create(payload: IntegrantGroupEvaluationCreate): Promise<IntegrantGroupEvaluation> {
    const response = await apiClient.post<IntegrantGroupEvaluation>("/integrant-group-evaluations/", payload)
    return response.data
  },
}
