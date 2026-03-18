import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import AuditLogModal from '../components/AuditLogModal';
import DocumentModal from '../components/DocumentModal';
import EmployeeModal from '../components/EmployeeModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useTheme } from '../components/theme-provider';
import { useToast } from '../components/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { BaseModal } from '../components/ui/BaseModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { cn } from '../lib/utils';

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
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLeaveDetailOpen, setIsLeaveDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [auditEntityId, setAuditEntityId] = useState<number | undefined>(undefined);
  const [auditEntityName, setAuditEntityName] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const employeePageSize = 8;
  const [leavePage, setLeavePage] = useState(1);
  const leavePageSize = 8;
  const [showInactive, setShowInactive] = useState(false);

  // Confirmation state
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  // Fetch Employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees', showInactive],
    queryFn: async () => { const { data } = await api.get(`/employees?active=${!showInactive}`); return data; },
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

  // Consolidated Statistics
  const { data: stats } = useQuery<{ totalEmployees: number; departmentCount: number; averageSalary: number; averageAge: number; }>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await api.get('/employees/statistics');
      return data;
    },
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
      setConfirmation(prev => ({ ...prev, isOpen: false }));
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error deactivating employee', 'error'),
  });

  const restoreEmployee = useMutation({
    mutationFn: (id: number) => api.put(`/employees/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      showToast('Employee restored', 'success');
      setConfirmation(prev => ({ ...prev, isOpen: false }));
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error restoring employee', 'error'),
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



  const isModalLoading = createEmployee.isPending || updateEmployee.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf2ff] via-[#fffbeb] to-[#f0f9ff] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300">
      
      {/* Mesh Gradient Decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Navigation Bar */}
      <div className="relative z-10 max-w-[1400px] mx-auto bg-white/70 backdrop-blur-md dark:bg-slate-800/80 p-3 rounded-full shadow-sm flex items-center justify-between mb-8 border border-white/40 dark:border-slate-700/50">
        <div className="flex items-center gap-2 pl-4">
          <div className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">EMS<span className="text-purple-500 text-3xl leading-[0]">.</span></div>
          <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium ml-1">HR Manager</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 pr-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors hidden sm:flex items-center justify-center"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {/* Avatar & Actions */}
          <div className="flex items-center gap-3 pl-2 sm:ml-2 sm:border-l border-slate-200 dark:border-slate-600">
            <div className="w-8 h-8 rounded-full bg-purple-600 dark:bg-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {username?.charAt(0).toUpperCase() || 'H'}
            </div>
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm font-medium transition-colors pr-2 hidden sm:block"
            >
              Password
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm font-medium transition-colors pr-2 hidden sm:block"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Welcome Section */}
        <div className="mb-4">
          <h1 className="text-4xl md:text-5xl font-light font-display tracking-tight text-slate-800 dark:text-white mb-2">
            HR <span className="font-semibold">Dashboard</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage the employee lifecycle, leave requests, and profile updates.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Employees', value: stats?.totalEmployees ?? 0, icon: 'Users', color: 'purple' },
            { label: 'Avg Salary', value: `$${Math.round(stats?.averageSalary ?? 0).toLocaleString()}`, icon: 'DollarSign', color: 'emerald' },
            { label: 'Avg Age', value: `${Math.round(stats?.averageAge ?? 0)} yrs`, icon: 'Calendar', color: 'blue' },
            { label: 'Pending Leaves', value: pendingCount, icon: 'Clock', color: 'rose' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 hover:shadow-md transition-all hover:-translate-y-1">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors", 
                stat.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
              )}>
                {stat.icon === 'Users' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                {stat.icon === 'DollarSign' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-13a9 9 0 110 18 9 9 0 010-18zm0 0V3m0 18v-3" /></svg>}
                {stat.icon === 'Calendar' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                {stat.icon === 'Clock' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-light font-display text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-center gap-2 bg-white/70 backdrop-blur-md dark:bg-slate-800/80 p-2 rounded-full shadow-sm border border-white/40 dark:border-slate-700/50">
          {[
            { id: 'employees', label: 'Employees' },
            { id: 'leaves', label: 'Leave Requests', count: pendingCount },
            { id: 'profileChanges', label: 'Profile Changes' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                activeTab === tab.id 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ============ EMPLOYEES TAB ============ */}
        {activeTab === 'employees' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chart Card */}
              <div className="lg:col-span-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 flex flex-col items-center">
                <h3 className="text-slate-800 dark:text-white font-semibold text-lg mb-6 self-start">Department Mix</h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={departmentStats} 
                        innerRadius="65%" 
                        outerRadius="90%" 
                        paddingAngle={8} 
                        dataKey="value" 
                        stroke="none"
                        animationBegin={200}
                        animationDuration={1000}
                      >
                        {departmentStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                        ))}
                      </Pie>
                      <Tooltip 
                        cursor={false} 
                        contentStyle={{ 
                          borderRadius: '1.5rem', 
                          border: 'none', 
                          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', 
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          padding: '12px 16px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                  {departmentStats.map((dept, index) => (
                    <div key={dept.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase truncate">{dept.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee Table */}
              <div className="lg:col-span-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-700/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                  <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative group flex-1 sm:w-64">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input 
                        type="text" 
                        placeholder="Search employees..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none border border-transparent focus:border-purple-500/50 transition-all" 
                      />
                    </div>
                    <select 
                      value={departmentFilter} 
                      onChange={e => setDepartmentFilter(e.target.value)}
                      className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none border border-transparent focus:border-purple-500/50 appearance-none cursor-pointer transition-all pr-10"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setShowInactive(!showInactive)}
                      className={cn(
                        "flex-1 sm:flex-none px-4 py-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2",
                        showInactive 
                          ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/50" 
                          : "bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800"
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      {showInactive ? 'Showing Inactive' : 'Show Inactive'}
                    </button>
                    <button
                      onClick={() => { setSelectedEmployee(null); setIsEmployeeModalOpen(true); }}
                      className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl text-sm font-semibold transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      Add New
                    </button>
                    <button 
                      onClick={handleExportCSV}
                      className="p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all active:scale-95 flex items-center justify-center"
                      title="Export CSV"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                </div>

                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hidden md:table-header-group">
                      <tr>
                        <th className="px-6 py-4">Employee info</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Salary & Age</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                              <p className="text-slate-500 font-medium">Loading workforce data...</p>
                            </div>
                          </td>
                        </tr>
                      ) : pagedEmployees.map(emp => (
                        <tr key={emp.id} className="group bg-white/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 transition-all rounded-3xl shadow-sm hover:shadow-md border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50">
                          <td className="px-6 py-4 rounded-l-3xl">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg shadow-inner ring-1 ring-purple-200/50 dark:ring-purple-800/30">
                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-white leading-tight">{emp.firstName} {emp.lastName}</span>
                                <span className="text-xs text-slate-400 font-mono mt-0.5">{emp.empId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 ring-1 ring-inset ring-purple-600/10">
                              {emp.departmentName}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-slate-900 dark:text-slate-100 font-semibold">${emp.salary.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{calculateAge(emp.dateOfBirth)} years old</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 rounded-r-3xl">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                              <button
                                onClick={() => { setSelectedEmployee(emp); setIsEmployeeModalOpen(true); }}
                                className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                                title="Edit Profile"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button 
                                onClick={() => { setAuditEntityId(emp.id); setAuditEntityName(`${emp.firstName} ${emp.lastName}`); setIsDocumentModalOpen(true); }}
                                className="p-2.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-colors"
                                title="Documents"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              </button>
                              <button 
                                onClick={() => { setAuditEntityId(emp.id); setAuditEntityName(`${emp.firstName} ${emp.lastName}`); setIsAuditModalOpen(true); }}
                                className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                                title="View History"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                              <button
                                onClick={() => {
                                  if (showInactive) {
                                    setConfirmation({
                                      isOpen: true,
                                      title: 'Restore Employee',
                                      message: `Are you sure you want to restore ${emp.firstName} ${emp.lastName} to active status?`,
                                      variant: 'success',
                                      onConfirm: () => restoreEmployee.mutate(emp.id)
                                    });
                                  } else {
                                    setConfirmation({
                                      isOpen: true,
                                      title: 'Deactivate Employee',
                                      message: `Are you sure you want to deactivate ${emp.firstName} ${emp.lastName}? This will restrict their access to the system.`,
                                      variant: 'danger',
                                      onConfirm: () => deactivateEmployee.mutate(emp.id)
                                    });
                                  }
                                }}
                                className={cn(
                                  "p-2.5 rounded-xl transition-colors",
                                  showInactive ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" : "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                )}
                                title={showInactive ? "Restore" : "Deactivate"}
                              >
                                {showInactive ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Page <span className="text-slate-900 dark:text-white">{employeePage}</span> of {totalEmployeePages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmployeePage(p => Math.max(1, p - 1))}
                      disabled={employeePage === 1}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                      onClick={() => setEmployeePage(p => Math.min(totalEmployeePages, p + 1))}
                      disabled={employeePage === totalEmployeePages}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ LEAVES TAB ============ */}
        {activeTab === 'leaves' && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Leave Workflow</h2>
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                  <button 
                    key={status} 
                    onClick={() => setLeaveFilter(status)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all transition-duration-300",
                      leaveFilter === status 
                        ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    )}
                  >
                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                    {status === 'PENDING' && pendingCount > 0 && (
                      <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {leavesLoading ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-medium">Synchronizing leave data...</td></tr>
                  ) : enrichedLeaves.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-medium">No leave requests found.</td></tr>
                  ) : (
                    pagedLeaves.map(leave => (
                      <tr key={leave.id} className="bg-white/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 transition-all rounded-3xl shadow-sm hover:shadow-md border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50">
                        <td className="px-6 py-4 rounded-l-3xl">
                          <span className="font-semibold text-slate-900 dark:text-white">{leave.employeeName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">{leave.startDate}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">until {leave.endDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-wider">{leave.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={leave.status} />
                        </td>
                        <td className="px-6 py-4 text-right rounded-r-3xl">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedLeave(leave); setIsLeaveDetailOpen(true); }}
                              className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all"
                              title="View Details"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            {leave.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: 'APPROVED' })}
                                  disabled={updateLeaveStatus.isPending}
                                  className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: 'REJECTED' })}
                                  disabled={updateLeaveStatus.isPending}
                                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Page <span className="text-slate-900 dark:text-white">{leavePage}</span> of {totalLeavePages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLeavePage(p => Math.max(1, p - 1))}
                  disabled={leavePage === 1}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={() => setLeavePage(p => Math.min(totalLeavePages, p + 1))}
                  disabled={leavePage === totalLeavePages}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ PROFILE CHANGES TAB ============ */}
        {activeTab === 'profileChanges' && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Update Verification</h2>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">New Contact Info</th>
                    <th className="px-6 py-4">Emergency Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profileChangesLoading ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-500">Validating profile requests...</td></tr>
                  ) : profileChanges.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-500">No pending profile changes.</td></tr>
                  ) : (
                    profileChanges.map(req => (
                      <tr key={req.id} className="bg-white/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 transition-all rounded-3xl shadow-sm hover:shadow-md border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50">
                        <td className="px-6 py-4 rounded-l-3xl">
                          <span className="font-semibold text-slate-900 dark:text-white">{req.employeeName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs truncate max-w-[150px]">{req.address || '-'}</span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">{req.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">{req.emergencyContactName || '-'}</span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">{req.emergencyContactPhone || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-right rounded-r-3xl">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => updateProfileChangeStatus.mutate({ id: req.id, status: 'APPROVED' })}
                                disabled={updateProfileChangeStatus.isPending}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateProfileChangeStatus.mutate({ id: req.id, status: 'REJECTED' })}
                                disabled={updateProfileChangeStatus.isPending}
                                className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs font-bold uppercase tracking-tighter">Processed</span>
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

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
        onConfirm={confirmation.onConfirm}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        isLoading={deactivateEmployee.isPending || restoreEmployee.isPending}
      />

      <BaseModal
        isOpen={isLeaveDetailOpen}
        onClose={() => setIsLeaveDetailOpen(false)}
        title="Leave Request Details"
        footer={
          selectedLeave && selectedLeave.status === 'PENDING' && (
            <div className="flex gap-3">
              <button
                onClick={() => { updateLeaveStatus.mutate({ id: selectedLeave.id, status: 'APPROVED' }); setIsLeaveDetailOpen(false); }}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Approve Request
              </button>
              <button
                onClick={() => { updateLeaveStatus.mutate({ id: selectedLeave.id, status: 'REJECTED' }); setIsLeaveDetailOpen(false); }}
                className="flex-1 py-3 bg-white dark:bg-slate-800 text-rose-600 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold active:scale-95 transition-all"
              >
                Decline
              </button>
            </div>
          )
        }
      >
        {selectedLeave && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                {selectedLeave.employeeName?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{selectedLeave.employeeName}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Request Applicant</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedLeave.startDate}</p>
              </div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">End Date</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedLeave.endDate}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason for Leave</p>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800 italic text-slate-600 dark:text-slate-400 text-sm">
                "{selectedLeave.reason || 'No reason specified'}"
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Status</span>
              <StatusBadge status={selectedLeave.status} />
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
}


