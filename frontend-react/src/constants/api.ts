export const API_BASE_URL = 'http://localhost:8081/api';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    CHANGE_PASSWORD: '/portal/change-password',
  },
  EMPLOYEES: {
    BASE: '/employees',
    BY_ID: (id: number | string) => `/employees/${id}`,
    LIST: (active: boolean) => `/employees?active=${active}`,
    STATISTICS: '/employees/statistics',
    RESTORE: (id: number) => `/employees/${id}/restore`,
    PERMANENT: (id: number) => `/employees/${id}/permanent`,
    LEAVES: '/employees/leaves',
    LEAVE_STATUS: (id: number) => `/employees/leaves/${id}/status`,
    DEACTIVATE: (id: number) => `/employees/${id}/deactivate`,
    DELETE: (id: number) => `/employees/${id}`,
    EXPORT_CSV: '/employees/export',
  },
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id: number) => `/departments/${id}`,
    LIST: '/departments',
    CREATE: '/departments',
    UPDATE: (id: number) => `/departments/${id}`,
    DELETE: (id: number) => `/departments/${id}`,
  },
  LEAVE_REQUESTS: {
    BASE: '/leave-requests',
    EMPLOYEE: (id: number) => `/leave-requests/employee/${id}`,
    UPDATE_STATUS: (id: number) => `/leave-requests/${id}/status`,
  },
  LEAVES: {
    UPDATE_STATUS: (id: number) => `/employees/leaves/${id}/status`,
  },
  PROFILE_CHANGES: {
    BASE: '/profile-changes',
    EMPLOYEE: (id: number) => `/profile-changes/employee/${id}`,
    UPDATE_STATUS: (id: number) => `/profile-changes/${id}/status`,
  },
  DOCUMENTS: {
    BASE: (employeeId: number) => `/admin/documents/${employeeId}`,
    EMPLOYEE: (employeeId: number) => `/admin/documents/employee/${employeeId}`,
    DOWNLOAD: (id: number) => `/admin/documents/download/${id}`,
    DELETE: (id: number) => `/admin/documents/${id}`,
  },
  AUDIT: {
    ENTITY: (type: string, id: number) => `/admin/audit/${type}/${id}`,
  },
  PORTAL: {
    ME: '/portal/me',
    LEAVES: '/portal/leaves',
    LEAVE_BALANCE: '/portal/leave-balance',
    DOCUMENTS: '/portal/documents',
    AUDIT: '/portal/audit',
    PROFILE_CHANGES: '/portal/profile-changes',
    DOWNLOAD: (id: number) => `/portal/documents/download/${id}`,
  },
};
