import { apiClient } from './api/client'

export interface CreateProjectPayload {
  title: string
  code: string
  keywords: string
  member_ids: number[]
  id_responsible: number | null
  thematic: string
  id_project_type: number | null
  art_state: string
  cientific_problem: string | null
  study_object: string | null
  study_field: string
  hypothesis: string
  main_objective: string | null
  research_methods: string
  interested_third_party: string | null
  national_group: string
  international_group: string | null
  publish_magazine: string | null
  participate_events: string | null
  citma_code: string | null
  minvec_code: string | null
  approved: boolean
  conseil_criteria: string
  initial_date: string
  final_date: string | null
  update_date: string
  id_project_state: number | null
  id_project_classification: number | null
  economic_budget: string
  economic_needs: string | null
  id_faculty: number | null
  concluded: boolean
  approved_date: string | null
  general_budget_cup: string | null
  year_budget_cup: string | null
  is_international: boolean
  is_national: boolean
  is_territorial: boolean
  is_cujae: boolean
}

export const projectService = {
  async createProject(data: CreateProjectPayload) {
    return apiClient.post('/projects/', data)
  },
}

