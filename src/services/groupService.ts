import { mockGroupMembers, mockGroupProjects, mockGroupRecords, mockProjects, mockRecords } from "./mockData"

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
}
