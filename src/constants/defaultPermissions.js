
export const DEFAULT_PERMISSIONS = {
  Dashboard: {
    viewSnapshot: false,
    viewAI: false,
    viewAtRisk: false,
  },
  Projects: {
    viewProjects: false,
    createProject: false,
    editProjectDetails: false,
    managePhasesTasks: false,
    projectRunway: false,
    projectLoad: false,
    postUpdates: false,
    approveUpdates: false,
    manageMilestones: false,
    manageFeedback: false,
  },
  Tasks: {
    viewTasks: false,
    createTask: false,
    editTask: false,
    logTime: false,
    requestApproval: false,
  },
  Updates: {
    viewUpdates: false,
    postUpdate: false,
    approveReject: false,
    publishToClient: false,
  },
  Tickets: {
    viewTickets: false,
    createTicket: false,
    assignTicket: false,
    changeStatus: false,
    reply: false,
  },
  Leads: {
    viewLeads: false,
    createLead: false,
    editLead: false,
    transferLead: false,
    sendEmail: false,
    setReminder: false,
    exportCSV: false,
  },
  Clients: {
    viewClients: false,
    viewHoursBilled: false,
    viewAIUpsell: false,
    editClient: false,
  },
  Calendar: {
    viewCalendar: false,
    createEvent: false,
    markHoliday: false,
    manageLeaves: false,
  },
  Resources: {
    viewCapacity: false,
    addOvertimeFreelancer: false,
    newProjectEstimates: false,
    viewAllocation: false,
  },
  Employees: {
    viewEmployees: false,
    addEmployee: false,
    viewProfiles: false,
    addRemarks: false,
    viewPerformance: false,
  },
  Roles: {
    viewRoles: false,
    createRole: false,
    editInheritance: false,
  },
  Permissions: {
    viewPermissions: false,
    editPermissions: false,
  }
};