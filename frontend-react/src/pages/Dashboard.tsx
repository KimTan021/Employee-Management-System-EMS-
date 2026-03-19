import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import UserManagement from '../components/UserManagement';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useTheme } from '../components/theme-provider';
import { useToast } from '../components/ToastContext';
import { cn } from '../lib/utils';
import { exportEmployeesToPDF } from '../lib/pdfExport';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../constants/api';
import { MESSAGES } from '../constants/messages';

// Types
interface Employee {
  id: number;
  empId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  departmentName: string;
  salary: number;
}

interface DashboardStats {
  totalEmployees: number;
  departmentCount: number;
  averageSalary: number;
  averageAge: number;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'users'>('users');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const employeePageSize = 5;

  // Fetch Employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees', showDeactivated],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.EMPLOYEES.LIST(!showDeactivated));
      return data;
    },
  });

  // Fetch Statistics
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.EMPLOYEES.STATISTICS);
      return data;
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const calculateAge = (dob: string) => {
    return Math.floor((new Date().getTime() - new Date(dob).getTime()) / 31557600000);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const searchLower = searchQuery.toLowerCase();
      return (
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.empId.toLowerCase().includes(searchLower)
      );
    });
  }, [employees, searchQuery]);

  useEffect(() => {
    setEmployeePage(1);
  }, [searchQuery]);

  const totalEmployeePages = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
  const pagedEmployees = filteredEmployees.slice(
    (employeePage - 1) * employeePageSize,
    employeePage * employeePageSize
  );

  // Chart Data preparation
  
  const departmentStats = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => {
      counts[emp.departmentName] = (counts[emp.departmentName] || 0) + 1;
    });
    return Object.keys(counts).map(dept => ({ name: dept, value: counts[dept] }));
  }, [employees]);

  const departmentColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    departmentStats.forEach((dept, index) => {
      map[dept.name] = COLORS[index % COLORS.length];
    });
    return map;
  }, [departmentStats]);

  const handleExportPDF = () => {
    if (!filteredEmployees || filteredEmployees.length === 0) {
      showToast(MESSAGES.COMMON.NO_DATA_EXPORT, 'info');
      return;
    }
    
    if (!stats) {
      showToast(MESSAGES.COMMON.STATS_NOT_LOADED, 'error');
      return;
    }

    exportEmployeesToPDF(
      filteredEmployees, 
      stats, 
      'Admin Dashboard: Employee Directory'
    );
    showToast(MESSAGES.COMMON.PDF_EXPORT_SUCCESS, 'success');
  };

  const handleExportCSV = () => {
    if (!filteredEmployees || filteredEmployees.length === 0) {
      showToast(MESSAGES.COMMON.NO_DATA_EXPORT, 'info');
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
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePermanent = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(ENDPOINTS.EMPLOYEES.PERMANENT(deleteId));
      showToast(MESSAGES.EMPLOYEE.DELETE_SUCCESS, 'success');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setDeleteId(null);
    } catch (error) {
      showToast(MESSAGES.EMPLOYEE.DELETE_ERROR, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef2f2] via-[#fffbeb] to-[#fff7ed] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300">
      
      {/* Mesh Gradient Decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Navigation Bar */}
      <div className="relative z-10 max-w-[1400px] mx-auto bg-white/70 backdrop-blur-md dark:bg-slate-800/80 p-3 rounded-full shadow-sm flex items-center justify-between mb-8 border border-white/40 dark:border-slate-700/50">
        <div className="flex items-center gap-2 pl-4">
          <div className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">EMS<span className="text-rose-500 text-3xl leading-[0]">.</span></div>
          <span className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-0.5 rounded-full font-medium ml-1">Admin</span>
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
            <div className="w-8 h-8 rounded-full bg-rose-600 dark:bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              A
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
            {MESSAGES.UI.ADMIN_DASHBOARD.TITLE.split(' ')[0]} <span className="font-semibold">{MESSAGES.UI.ADMIN_DASHBOARD.TITLE.split(' ')[1]}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{MESSAGES.UI.ADMIN_DASHBOARD.SUBTITLE}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: MESSAGES.UI.HR_DASHBOARD.COL_EMPLOYEE_INFO.split(' ')[1] + 's', value: stats?.totalEmployees ?? 0, icon: 'Users', color: 'rose' },
            { label: MESSAGES.UI.HR_DASHBOARD.TAB_DEPARTMENTS, value: stats?.departmentCount ?? 0, icon: 'Hexagon', color: 'amber' },
            { label: 'Avg Salary', value: `$${Math.round(stats?.averageSalary ?? 0).toLocaleString()}`, icon: 'DollarSign', color: 'indigo' },
            { label: 'Avg Age', value: `${Math.round(stats?.averageAge ?? 0)} yrs`, icon: 'Calendar', color: 'emerald' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 hover:shadow-md transition-all hover:-translate-y-1">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors", 
                stat.color === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' :
                stat.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                stat.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' :
                'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              )}>
                {stat.icon === 'Users' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                {stat.icon === 'Hexagon' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                {stat.icon === 'DollarSign' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-13a9 9 0 110 18 9 9 0 010-18zm0 0V3m0 18v-3" /></svg>}
                {stat.icon === 'Calendar' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-light font-display text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Admin Tabs */}
          <div className="flex items-center justify-center gap-2 bg-white/70 backdrop-blur-md dark:bg-slate-800/80 p-2 rounded-full shadow-sm border border-white/40 dark:border-slate-700/50">
            <button 
              onClick={() => setActiveAdminTab('overview')} 
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all",
                activeAdminTab === 'overview' 
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-500/25" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              {MESSAGES.UI.ADMIN_DASHBOARD.TAB_OVERVIEW}
            </button>
            <button 
              onClick={() => setActiveAdminTab('users')} 
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all",
                activeAdminTab === 'users' 
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-500/25" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              {MESSAGES.UI.ADMIN_DASHBOARD.TAB_USERS}
            </button>
          </div>

        {activeAdminTab === 'users' ? (
          <UserManagement />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Charts Column */}
            <div className="lg:col-span-4 space-y-8">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 flex flex-col items-center">
                  <h3 className="text-slate-800 dark:text-white font-semibold text-lg mb-6 self-start tracking-tight">{MESSAGES.UI.ADMIN_DASHBOARD.SYSTEM_OVERVIEW}</h3>
                <div className="h-64 w-full flex items-center justify-center">
                  {departmentStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departmentStats}
                          innerRadius="60%"
                          outerRadius="80%"
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {departmentStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-400 text-xs font-medium uppercase tracking-widest text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                      No Data<br/>Available
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {departmentStats.map((dept, idx) => (
                    <div key={dept.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      {dept.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div>
                  <h3 className="text-xl font-display font-semibold mb-1">System Health</h3>
                  <p className="text-rose-200/60 text-xs">All services operational</p>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-display font-light">100%</div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-8 bg-rose-500/30 rounded-full overflow-hidden"><div className="w-full h-full bg-rose-500 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div></div>)}
                  </div>
                </div>
              </div>
            </div>

            {/* List Column */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
               <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold font-display text-slate-900 dark:text-white">Internal Directory</h2>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Active/Inactive Toggle */}
                    <button 
                      onClick={() => setShowDeactivated(!showDeactivated)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
                        showDeactivated 
                          ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", showDeactivated ? "bg-amber-500" : "bg-emerald-500")}></div>
                      {showDeactivated ? 'Inactive Pool' : 'Active Staff'}
                    </button>

                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all" />
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button onClick={handleExportPDF} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Export PDF">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </button>
                    <button onClick={handleExportCSV} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Export CSV">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
               </div>

               <div className="p-4 overflow-x-auto">
                 <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                   <thead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest hidden md:table-header-group">
                      <tr>
                        <th className="px-6 py-4">{MESSAGES.UI.HR_DASHBOARD.COL_EMPLOYEE_INFO}</th>
                        <th className="px-6 py-4">{MESSAGES.UI.HR_DASHBOARD.COL_DEPARTMENT}</th>
                        <th className="px-6 py-4">{MESSAGES.UI.HR_DASHBOARD.COL_SALARY_AGE}</th>
                      </tr>
                   </thead>
                   <tbody className="md:table-row-group flex flex-col gap-4 md:gap-0">
                     {isLoading ? (
                       <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-10 h-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin"></div>
                              <p className="text-slate-500 font-medium">{MESSAGES.UI.HR_DASHBOARD.LOADING_WORKFORCE}</p>
                            </div>
                        </td></tr>
                     ) : (
                       pagedEmployees.map(emp => (
                         <tr key={emp.id} className="bg-slate-50/50 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/60 transition-all rounded-2xl shadow-sm hover:shadow-md flex flex-col md:table-row cursor-default">
                           <td className="px-6 py-4 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 flex items-center justify-center font-bold">
                                 {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                               </div>
                               <div>
                                 <p className="font-semibold text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                                 <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{emp.empId}</p>
                               </div>
                             </div>
                           </td>
                           <td className="px-6 py-2 md:py-4">
                              <span className="md:hidden text-[10px] uppercase text-slate-400 block mb-1 font-bold">Department</span>
                              <span 
                                className="px-3 py-1 rounded-lg text-xs font-semibold border shadow-sm transition-colors"
                                style={{ 
                                  backgroundColor: `${departmentColorMap[emp.departmentName] || '#6366f1'}15`, 
                                  color: departmentColorMap[emp.departmentName] || '#6366f1',
                                  borderColor: `${departmentColorMap[emp.departmentName] || '#6366f1'}30`
                                }}
                              >
                                {emp.departmentName}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="md:hidden text-[10px] uppercase text-slate-400 block mb-1 font-bold">Details</span>
                              <div className="flex flex-col">
                                <span className="text-slate-900 dark:text-slate-100 font-semibold">${emp.salary.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{calculateAge(emp.dateOfBirth)} {MESSAGES.UI.HR_DASHBOARD.YEARS_OLD}</span>
                              </div>
                            </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
                              <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {MESSAGES.UI.HR_DASHBOARD.PAGE} <span className="text-slate-900 dark:text-white">{employeePage}</span> {MESSAGES.UI.HR_DASHBOARD.OF} {totalEmployeePages}
                    </span>
                  <div className="flex gap-2">
                    <button onClick={() => setEmployeePage(p => Math.max(1, p - 1))} disabled={employeePage === 1} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl disabled:opacity-30 transition-all font-semibold text-xs uppercase tracking-widest">Prev</button>
                    <button onClick={() => setEmployeePage(p => Math.min(totalEmployeePages, p + 1))} disabled={employeePage === totalEmployeePages} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl disabled:opacity-30 transition-all font-semibold text-xs uppercase tracking-widest">Next</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeletePermanent}
        title="Permanent Deletion"
        message="Are you sure you want to permanently delete this employee? This will irreversibly remove all associated files, leave requests, and user account data. This action cannot be undone."
        confirmLabel="Permanent Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

