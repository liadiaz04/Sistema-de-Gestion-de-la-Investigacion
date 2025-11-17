import { mockGroupMembers, mockGroupProjects, mockGroupRecords, mockProjects, mockRecords } from "./mockData"
import { apiClient } from "./api/client"

export interface CreateGroupPayload {
  name: string
  subjects: string
  problems: string
  id_admin: number
  id_faculty: number
  create_date: string
  update_date: string
  member_ids: number[]
  id_faculty_area: number
}

export const groupService = {
  getGroupMembers: async (groupId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockGroupMembers[groupId] || []
  },

  getGroupProjects: async (groupId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300))
    const projectIds = mockGroupProjects[groupId] || []
    return mockProjects.filter((p) => projectIds.includes(p.id))
  },

  getGroupRecords: async (groupId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300))
    const recordIds = mockGroupRecords[groupId] || []
    return mockRecords.filter((r) => recordIds.includes(r.id))
  },

  async createGroup(data: CreateGroupPayload) {
    return apiClient.post('/groups/', data)
  },
}
