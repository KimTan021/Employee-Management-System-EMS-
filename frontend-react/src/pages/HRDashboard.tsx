import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import AuditLogModal from '../components/AuditLogModal';
import DocumentModal from '../components/DocumentModal';
import EmployeeModal from '../components/EmployeeModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useTheme } from '../components/theme-provider';
import { useToast } from '../components/ToastContext';
import { useModalBehavior } from '../components/shared/useModalBehavior';

interface Employee {
  id: number;
  empId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  departmentName: string;
  salary: number;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  annualLeaveBalance?: number;
  sickLeaveBalance?: number;
  personalLeaveBalance?: number;
  active?: boolean;
}

interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName?: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reason: string;
}

interface Department {
  id: number;
  name: string;
}

interface ProfileChangeRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  status: string;
  createdAt: string;
}

export default function HRDashboard() {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<'employees' | 'leaves' | 'profileChanges'>('employees');
  const [leaveFilter, setLeaveFilter] = useState('ALL');

  // Modal states
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [isLeaveDetailOpen, setIsLeaveDetailOpen] = useState(false);
  const leaveDetailModalRef = useRef<HTMLDivElement>(null);
  const leaveDetailInitialFocusRef = useRef<HTMLButtonElement>(null);

  const [auditEntityId, setAuditEntityId] = useState<number | undefined>(undefined);
  const [auditEntityName, setAuditEntityName] = useState('');

  useModalBehavior({
    isOpen: isLeaveDetailOpen,
    onClose: () => setIsLeaveDetailOpen(false),
    modalRef: leaveDetailModalRef,
    initialFocusRef: leaveDetailInitialFocusRef,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const employeePageSize = 8;
  const [leavePage, setLeavePage] = useState(1);
  const leavePageSize = 8;

  // Fetch Employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => { const { data } = await api.get('/employees'); return data; },
  });

  // Fetch Departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => { const { data } = await api.get('/departments'); return data; },
  });

  // Fetch Leave Requests
  const { data: leaves = [], isLoading: leavesLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['allLeaves'],
    queryFn: async () => { const { data } = await api.get('/employees/leaves'); return data; },
  });

  // Fetch Profile Change Requests
  const { data: profileChanges = [], isLoading: profileChangesLoading } = useQuery<ProfileChangeRequest[]>({
    queryKey: ['profileChanges'],
    queryFn: async () => { const { data } = await api.get('/profile-changes'); return data; },
  });

  // Statistics
  const { data: avgSalary } = useQuery<number>({
    queryKey: ['averageSalary'],
    queryFn: async () => { const { data } = await api.get('/employees/statistics/average-salary'); return data; },
  });

  const { data: avgAge } = useQuery<number>({
    queryKey: ['averageAge'],
    queryFn: async () => { const { data } = await api.get('/employees/statistics/average-age'); return data; },
  });





  // Leave status mutation
  const updateLeaveStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/employees/leaves/${id}/status?status=${status}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allLeaves'] }); showToast('Leave status updated', 'success'); },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error updating leave', 'error'),
  });

  const updateProfileChangeStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/profile-changes/${id}/status?status=${status}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profileChanges'] }); showToast('Profile change updated', 'success'); },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error updating request', 'error'),
  });

  // Employee mutations (HR can create/update)
  const createEmployee = useMutation({
    mutationFn: (data: any) => api.post('/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsEmployeeModalOpen(false);
      setSelectedEmployee(null);
      showToast('Employee created successfully', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error creating employee', 'error'),
  });

  const updateEmployee = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsEmployeeModalOpen(false);
      setSelectedEmployee(null);
      showToast('Employee updated', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error updating employee', 'error'),
  });

  const deactivateEmployee = useMutation({
    mutationFn: (id: number) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      showToast('Employee deactivated', 'info');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error deactivating employee', 'error'),
  });

  const handleLogout = () => { logout(); navigate('/login'); };



  const calculateAge = (dob: string) => Math.floor((new Date().getTime() - new Date(dob).getTime()) / 31557600000);

  const handleSaveEmployee = (empData: any) => {
    if (selectedEmployee) {
      updateEmployee.mutate({ id: selectedEmployee.id, data: empData });
    } else {
      createEmployee.mutate(empData);
    }
  };

  const handleExportCSV = () => {
    if (!filteredEmployees || filteredEmployees.length === 0) {
      showToast('No data to export', 'info');
      return;
    }
    const headers = ['ID', 'Employee ID', 'First Name', 'Last Name', 'Department', 'Date of Birth', 'Salary'];
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...filteredEmployees.map(emp => 
        [emp.id, emp.empId, `"${emp.firstName}"`, `"${emp.lastName}"`, `"${emp.departmentName}"`, emp.dateOfBirth, emp.salary].join(',')
      )
    ].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV exported successfully', 'success');
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = emp.firstName.toLowerCase().includes(searchLower) || emp.lastName.toLowerCase().includes(searchLower) || emp.empId.toLowerCase().includes(searchLower);
      const matchesDept = departmentFilter ? emp.departmentName === departmentFilter : true;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, departmentFilter]);

  useEffect(() => {
    setEmployeePage(1);
  }, [searchQuery, departmentFilter]);

  const filteredLeaves = useMemo(() => {
    if (leaveFilter === 'ALL') return leaves;
    return leaves.filter(l => l.status === leaveFilter);
  }, [leaves, leaveFilter]);

  useEffect(() => {
    setLeavePage(1);
  }, [leaveFilter]);

  // Enrich leave requests with employee names
  const enrichedLeaves = useMemo(() => {
    return filteredLeaves.map(leave => {
      const emp = employees.find(e => e.id === leave.employeeId);
      return { ...leave, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${leave.employeeId}` };
    });
  }, [filteredLeaves, employees]);

  const totalEmployeePages = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
  const pagedEmployees = filteredEmployees.slice(
    (employeePage - 1) * employeePageSize,
    employeePage * employeePageSize
  );

  const totalLeavePages = Math.max(1, Math.ceil(enrichedLeaves.length / leavePageSize));
  const pagedLeaves = enrichedLeaves.slice(
    (leavePage - 1) * leavePageSize,
    leavePage * leavePageSize
  );

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const departmentStats = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => { counts[emp.departmentName] = (counts[emp.departmentName] || 0) + 1; });
    return Object.keys(counts).map(dept => ({ name: dept, value: counts[dept] }));
  }, [employees]);



  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
  };

  const isModalLoading = createEmployee.isPending || updateEmployee.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2f6] via-[#fdfaf4] to-[#faedd0] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300">

      {/* Top Navigation */}
      <div className="max-w-[1400px] mx-auto bg-white/70 backdrop-blur-md dark:bg-slate-800/80 p-3 rounded-full shadow-sm flex items-center justify-between mb-8 border border-white/40 dark:border-slate-700/50">
        <div className="flex items-center gap-2 pl-4">
          <div className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">EMS<span className="text-purple-500 text-3xl leading-[0]">.</span></div>
          <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium ml-1">HR</span>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <button onClick={() => setActiveTab('employees')} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'employees' ? 'bg-slate-800 dark:bg-white dark:text-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            Employees
          </button>
          <button onClick={() => setActiveTab('leaves')} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors relative ${activeTab === 'leaves' ? 'bg-slate-800 dark:bg-white dark:text-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            Leave Requests
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{pendingCount}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('profileChanges')} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'profileChanges' ? 'bg-slate-800 dark:bg-white dark:text-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            Profile Changes
          </button>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors hidden sm:flex items-center justify-center" aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <div className="flex items-center gap-3 pl-2 sm:ml-2 sm:border-l border-slate-200 dark:border-slate-600">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">{username?.charAt(0).toUpperCase()}</div>
            <button onClick={() => setIsChangePasswordOpen(true)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm font-medium transition-colors pr-2 hidden sm:block">Change Password</button>
            <button onClick={handleLogout} className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm font-medium transition-colors pr-2 hidden sm:block">Logout</button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Buttons */}
      <div className="max-w-[1400px] mx-auto sm:hidden flex gap-2 mb-6">
        <button onClick={() => setActiveTab('employees')} className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'employees' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>Employees</button>
        <button onClick={() => setActiveTab('leaves')} className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-colors relative ${activeTab === 'leaves' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>
          Leaves {pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
        </button>
        <button onClick={() => setActiveTab('profileChanges')} className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'profileChanges' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>Profile</button>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-800 dark:text-white mb-2">HR Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage the employee lifecycle and leave requests.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Employees', value: employees.length, color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
            { label: 'Avg Salary', value: `$${Math.round(avgSalary || 0).toLocaleString()}`, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
            { label: 'Avg Age', value: avgAge?.toFixed(1) ?? '-', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
            { label: 'Pending Leaves', value: pendingCount, color: pendingCount > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} rounded-2xl p-5 text-center`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
              <p className="text-3xl font-light">{value}</p>
            </div>
          ))}
        </div>

        {/* ============ EMPLOYEES TAB ============ */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chart */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden h-72 hidden lg:flex flex-col">
                <h3 className="text-slate-800 dark:text-white font-medium text-sm mb-2">Department Structure</h3>
                <div className="flex-1 w-full h-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={departmentStats} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
                        {departmentStats.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip cursor={false} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)' }} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Employee Table */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex gap-3 flex-wrap">
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 rounded-full text-sm w-48 focus:ring-2 focus:ring-purple-500 outline-none border-none" />
                    </div>
                    <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 rounded-full text-sm focus:ring-2 focus:ring-purple-500 outline-none border-none appearance-none cursor-pointer">
                      <option value="">All Depts</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedEmployee(null); setIsEmployeeModalOpen(true); }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      Add Employee
                    </button>
                    <button onClick={handleExportCSV}
                      className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto p-2">
                  <table className="w-full text-left text-sm whitespace-nowrap border-spacing-y-2 border-separate">
                    <thead className="text-slate-400 font-medium hidden md:table-header-group">
                      <tr>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Age / Salary</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500"><div className="flex flex-col items-center gap-4"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div><p>Loading...</p></div></td></tr>
                      ) : filteredEmployees.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No employees match your filters.</td></tr>
                      ) : (
                        pagedEmployees.map(emp => (
                          <tr key={emp.id} className="bg-slate-50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-700/80 transition-all rounded-3xl shadow-sm hover:shadow-md group flex flex-col md:table-row mb-4 md:mb-0">
                            <td className="px-6 py-4 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-medium shrink-0">{emp.firstName.charAt(0)}{emp.lastName.charAt(0)}</div>
                                <div className="font-medium text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</div>
                              </div>
                            </td>
                            <td className="px-6 py-2 md:py-4 text-slate-500 font-mono text-xs">{emp.empId}</td>
                            <td className="px-6 py-2 md:py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200">
                                {emp.departmentName}
                              </span>
                            </td>
                            <td className="px-6 py-2 md:py-4">
                              <span className="text-slate-800 dark:text-slate-200 font-medium">${emp.salary.toLocaleString()}</span>
                              <span className="text-slate-400 text-xs ml-2">{calculateAge(emp.dateOfBirth)} yrs</span>
                            </td>
                            <td className="px-6 py-4 text-right rounded-b-3xl md:rounded-r-3xl md:rounded-bl-none">
                              <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setSelectedEmployee(emp); setIsEmployeeModalOpen(true); }}
                                  className="p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>                                <button
                                  onClick={() => { if (confirm(`Deactivate ${emp.firstName} ${emp.lastName}?`)) deactivateEmployee.mutate(emp.id); }}
                                  className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                  title="Deactivate"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414-1.414L5.636 15.536l-1.414 4.243 4.243-1.414L18.364 5.636zM14 7l3 3" /></svg>
                                </button>
                                <button onClick={() => { setAuditEntityId(emp.id); setAuditEntityName(`${emp.firstName} ${emp.lastName}`); setIsDocumentModalOpen(true); }}
                                  className="p-2 text-teal-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-colors" title="Documents">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </button>
                                <button onClick={() => { setAuditEntityId(emp.id); setAuditEntityName(`${emp.firstName} ${emp.lastName}`); setIsAuditModalOpen(true); }}
                                  className="p-2 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors" title="History">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 pb-6 flex items-center justify-between text-sm text-slate-500">
                  <span>
                    Page {employeePage} of {totalEmployeePages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmployeePage(p => Math.max(1, p - 1))}
                      disabled={employeePage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setEmployeePage(p => Math.min(totalEmployeePages, p + 1))}
                      disabled={employeePage === totalEmployeePages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ LEAVES TAB ============ */}
        {activeTab === 'leaves' && (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Leave Requests</h2>
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                  <button key={status} onClick={() => setLeaveFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${leaveFilter === status ? 'bg-slate-800 dark:bg-white dark:text-slate-900 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                    {status === 'PENDING' && pendingCount > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-medium uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {leavesLoading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading leave requests...</td></tr>
                  ) : enrichedLeaves.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No leave requests found.</td></tr>
                  ) : (
                    pagedLeaves.map(leave => (
                      <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{leave.employeeName}</td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600 dark:text-slate-300">{leave.startDate}</span>
                          <span className="text-slate-400 mx-1">to</span>
                          <span className="text-slate-600 dark:text-slate-300">{leave.endDate}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{leave.type}</td>
                        <td
                          className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate"
                          title={leave.reason || ''}
                        >
                          {leave.reason || '-'}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(leave.status)}</td>
                        <td className="px-6 py-4 text-right">
                          {leave.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setSelectedLeave(leave); setIsLeaveDetailOpen(true); }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: 'APPROVED' })}
                                disabled={updateLeaveStatus.isPending}
                                className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: 'REJECTED' })}
                                disabled={updateLeaveStatus.isPending}
                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setSelectedLeave(leave); setIsLeaveDetailOpen(true); }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Details
                              </button>
                              <span className="text-slate-400 text-xs italic">-</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 pb-6 flex items-center justify-between text-sm text-slate-500">
              <span>
                Page {leavePage} of {totalLeavePages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLeavePage(p => Math.max(1, p - 1))}
                  disabled={leavePage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setLeavePage(p => Math.min(totalLeavePages, p + 1))}
                  disabled={leavePage === totalLeavePages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ PROFILE CHANGES TAB ============ */}
        {activeTab === 'profileChanges' && (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Profile Change Requests</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-medium uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Emergency Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {profileChangesLoading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading profile changes...</td></tr>
                  ) : profileChanges.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No profile change requests found.</td></tr>
                  ) : (
                    profileChanges.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{req.employeeName}</td>
                        <td className="px-6 py-4 text-slate-500">{req.phone || '-'}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={req.address || ''}>{req.address || '-'}</td>
                        <td className="px-6 py-4 text-slate-500">
                          <div className="text-xs">{req.emergencyContactName || '-'}</div>
                          <div className="text-xs text-slate-400">{req.emergencyContactPhone || '-'}</div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                        <td className="px-6 py-4 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => updateProfileChangeStatus.mutate({ id: req.id, status: 'APPROVED' })}
                                disabled={updateProfileChangeStatus.isPending}
                                className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateProfileChangeStatus.mutate({ id: req.id, status: 'REJECTED' })}
                                disabled={updateProfileChangeStatus.isPending}
                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}

      <AuditLogModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} entityId={auditEntityId} entityType="EMPLOYEE" entityName={auditEntityName} />
      <DocumentModal isOpen={isDocumentModalOpen} onClose={() => setIsDocumentModalOpen(false)} employeeId={auditEntityId} employeeName={auditEntityName} />
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => { setIsEmployeeModalOpen(false); setSelectedEmployee(null); }}
        initialData={selectedEmployee}
        title={selectedEmployee ? 'Edit Employee' : 'Add Employee'}
        onSave={handleSaveEmployee}
        isLoading={isModalLoading}
      />
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {isLeaveDetailOpen && selectedLeave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsLeaveDetailOpen(false); }}
        >
          <div ref={leaveDetailModalRef} className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Leave Details</h2>
              <button
                ref={leaveDetailInitialFocusRef}
                onClick={() => setIsLeaveDetailOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div><span className="font-semibold text-slate-800 dark:text-slate-100">Employee:</span> {selectedLeave.employeeName}</div>
              <div><span className="font-semibold text-slate-800 dark:text-slate-100">Dates:</span> {selectedLeave.startDate} to {selectedLeave.endDate}</div>
              <div><span className="font-semibold text-slate-800 dark:text-slate-100">Type:</span> {selectedLeave.type}</div>
              <div><span className="font-semibold text-slate-800 dark:text-slate-100">Reason:</span> {selectedLeave.reason || '-'}</div>
              <div><span className="font-semibold text-slate-800 dark:text-slate-100">Status:</span> {selectedLeave.status}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


