import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import EmployeeModal from '../components/EmployeeModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useTheme } from '../components/theme-provider';

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

export default function Dashboard() {
  const { username, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // Modal states
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | undefined>(undefined);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [ageRangeFilter, setAgeRangeFilter] = useState('');

  // Fetch Employees
  const { data: employees = [], isLoading, error } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await api.get('/employees');
      return data;
    },
  });

  // Statistics
  const { data: avgSalary } = useQuery<number>({
    queryKey: ['averageSalary'],
    queryFn: async () => {
      const { data } = await api.get('/employees/statistics/average-salary');
      return data;
    },
  });

  const { data: avgAge } = useQuery<number>({
    queryKey: ['averageAge'],
    queryFn: async () => {
      const { data } = await api.get('/employees/statistics/average-age');
      return data;
    },
  });

  // Mutations
  const createEmployee = useMutation({
    mutationFn: (newEmp: any) => api.post('/employees', newEmp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['averageSalary'] });
      queryClient.invalidateQueries({ queryKey: ['averageAge'] });
      setIsEmployeeModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.details?.[0] || 'Error creating employee')
  });

  const updateEmployee = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => api.put(`/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['averageSalary'] });
      queryClient.invalidateQueries({ queryKey: ['averageAge'] });
      setIsEmployeeModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.details?.[0] || 'Error updating employee')
  });

  const deleteEmployee = useMutation({
    mutationFn: (id: number) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['averageSalary'] });
      queryClient.invalidateQueries({ queryKey: ['averageAge'] });
      setIsDeleteModalOpen(false);
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveEmployee = (empData: any) => {
    if (selectedEmployee) {
      updateEmployee.mutate({ id: selectedEmployee.id, data: empData });
    } else {
      createEmployee.mutate(empData);
    }
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      deleteEmployee.mutate(employeeToDelete.id);
    }
  };

  // Helper formula: Compute age roughly from YYYY-MM-DD
  const calculateAge = (dob: string) => {
    return Math.floor((new Date().getTime() - new Date(dob).getTime()) / 31557600000);
  };

  // Filter Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Name or ID Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.empId.toLowerCase().includes(searchLower);

      // Department Filter
      const matchesDept = departmentFilter ? emp.departmentName === departmentFilter : true;

      // Age Range Filter
      let matchesAge = true;
      if (ageRangeFilter) {
        const age = calculateAge(emp.dateOfBirth);
        if (ageRangeFilter === '20-30') matchesAge = age >= 20 && age <= 30;
        else if (ageRangeFilter === '31-40') matchesAge = age > 30 && age <= 40;
        else if (ageRangeFilter === '41-50') matchesAge = age > 40 && age <= 50;
        else if (ageRangeFilter === '50+') matchesAge = age > 50;
      }

      return matchesSearch && matchesDept && matchesAge;
    });
  }, [employees, searchQuery, departmentFilter, ageRangeFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2f6] via-[#fdfaf4] to-[#faedd0] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300">
      
      {/* Top Navigation Bar - Pill Shaped */}
      <div className="max-w-[1400px] mx-auto bg-white/70 backdrop-blur-md dark:bg-slate-800/80 p-3 rounded-full shadow-sm flex items-center justify-between mb-8 border border-white/40 dark:border-slate-700/50">
        <div className="flex items-center gap-2 pl-4">
           {/* Logo / Brand */}
           <div className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">EMS<span className="text-accent text-3xl leading-[0]">.</span></div>
        </div>

        {/* Center Nav Pills (Mock for visual) */}
        <div className="hidden lg:flex items-center gap-1">
          <button className="px-5 py-2 bg-slate-800 text-white rounded-full text-sm font-medium shadow-md">Dashboard</button>
          <button className="px-5 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-full text-sm font-medium transition-colors">People</button>
          <button className="px-5 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-full text-sm font-medium transition-colors">Departments</button>
          <button className="px-5 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-full text-sm font-medium transition-colors">Payroll</button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 pr-2">
          
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors hidden sm:block"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors hidden sm:block">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors relative hidden sm:block">
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-white dark:border-slate-800"></span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>
          <div className="flex items-center gap-3 pl-2 sm:ml-2 sm:border-l border-slate-200 dark:border-slate-600">
             <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {username?.charAt(0).toUpperCase()}
             </div>
             <button 
               onClick={handleLogout}
               className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm font-medium transition-colors pr-2"
             >
               Logout
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8">
        
        {/* Header Section */}
        <div className="mb-4">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-800 dark:text-white mb-2">Welcome in, <span className="font-medium">{username}</span></h1>
          <p className="text-slate-500 dark:text-slate-400">Here's your organization overview. Role: {role}</p>
        </div>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (User / Quick Stats) */}
          <div className="lg:col-span-4 space-y-6">
             {/* Profile Card Inspired by original image */}
             <div className="bg-slate-800 dark:bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl min-h-[220px] flex flex-col justify-end">
                {/* Abstract shape background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-semibold mb-1">{username}</h2>
                    <p className="text-white/70 text-sm">{role === 'ADMIN' ? 'System Administrator' : 'Employee'}</p>
                  </div>
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-sm font-medium">
                     Admin Status
                  </div>
                </div>
             </div>

             {/* Smaller Widget */}
             <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100/50 dark:border-slate-700/50 hover:shadow-md transition-shadow">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-slate-800 dark:text-white font-medium">Avg Salary</h3>
                 <span className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></span>
               </div>
               <p className="text-4xl font-light text-slate-800 dark:text-white">${Math.round(avgSalary || 0).toLocaleString()}</p>
               <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
                 <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> Above median</span>
               </div>
             </div>
          </div>

          {/* Right Column (Metrics & Lists) */}
          <div className="lg:col-span-8 space-y-6">
             {/* Key Metrics Row */}
             <div className="bg-white/60 backdrop-blur-sm dark:bg-slate-800/40 p-6 rounded-[32px] border border-white/40 dark:border-slate-700/30 flex flex-wrap gap-8 md:gap-16 justify-between items-center px-8">
               <div className="flex flex-col items-center">
                 <p className="text-slate-500 font-medium text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   Employees
                 </p>
                 <p className="text-5xl md:text-6xl font-light text-slate-800 dark:text-white">{isLoading ? '-' : employees.length}</p>
               </div>
               <div className="flex flex-col items-center">
                 <p className="text-slate-500 font-medium text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Avg Age
                 </p>
                 <p className="text-5xl md:text-6xl font-light text-slate-800 dark:text-white">{avgAge?.toFixed(1) ?? '-'}</p>
               </div>
               <div className="flex flex-col items-center">
                 <p className="text-slate-500 font-medium text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   Depts
                 </p>
                 <p className="text-5xl md:text-6xl font-light text-slate-800 dark:text-white">4</p>
               </div>
             </div>

             {/* Employee List Section */}
             <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
               <div className="p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-slate-100 dark:border-slate-700 w-full overflow-hidden">
                 
                 {/* Filters */}
                 <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-wrap">
                   <div className="relative">
                     <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     <input 
                       type="text" 
                       placeholder="Search employees..." 
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border-none rounded-full text-slate-700 dark:text-white focus:ring-2 focus:ring-accent outline-none text-sm w-full sm:w-64 transition-all"
                     />
                   </div>
                   <select 
                     value={departmentFilter}
                     onChange={e => setDepartmentFilter(e.target.value)}
                     className="px-5 py-3 bg-slate-50 dark:bg-slate-700 border-none rounded-full text-slate-700 dark:text-white focus:ring-2 focus:ring-accent outline-none text-sm w-full sm:w-40 appearance-none cursor-pointer"
                   >
                     <option value="">All Depts</option>
                     <option value="Engineering">Engineering</option>
                     <option value="HR">HR</option>
                     <option value="Sales">Sales</option>
                     <option value="Marketing">Marketing</option>
                   </select>
                   <select 
                     value={ageRangeFilter}
                     onChange={e => setAgeRangeFilter(e.target.value)}
                     className="px-5 py-3 bg-slate-50 dark:bg-slate-700 border-none rounded-full text-slate-700 dark:text-white focus:ring-2 focus:ring-accent outline-none text-sm w-full sm:w-36 appearance-none cursor-pointer"
                   >
                     <option value="">All Ages</option>
                     <option value="20-30">20 - 30</option>
                     <option value="31-40">31 - 40</option>
                     <option value="41-50">41 - 50</option>
                     <option value="50+">50+</option>
                   </select>
                 </div>

                 {/* Actions */}
                 {role === 'ADMIN' && (
                   <button 
                     onClick={() => { setSelectedEmployee(undefined); setIsEmployeeModalOpen(true); }}
                     className="w-full xl:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-full text-sm font-medium transition-colors shadow-md whitespace-nowrap flex items-center justify-center gap-2"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                     Add Employee
                   </button>
                 )}
               </div>
               
               <div className="overflow-x-auto p-2">
                 <table className="w-full text-left text-sm whitespace-nowrap border-spacing-y-2 border-separate">
                   <thead className="text-slate-400 font-medium px-4 hidden md:table-header-group">
                     <tr>
                       <th className="px-6 py-3 pb-4">Employee</th>
                       <th className="px-6 py-3 pb-4">ID</th>
                       <th className="px-6 py-3 pb-4">Department</th>
                       <th className="px-6 py-3 pb-4">Age / Salary</th>
                       {role === 'ADMIN' && <th className="px-6 py-3 pb-4 text-right">Actions</th>}
                     </tr>
                   </thead>
                   <tbody className="space-y-4">
                     {isLoading ? (
                       <tr>
                         <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
                              <p>Loading records...</p>
                            </div>
                         </td>
                       </tr>
                     ) : error ? (
                        <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl mx-4 block">
                           Failed to load employees. Ensure the backend is running and you have proper access.
                         </td>
                       </tr>
                     ) : filteredEmployees.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                           <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl mx-4">
                              <span className="text-4xl mb-4">🔍</span>
                              <p className="text-lg">No employees found matching criteria</p>
                           </div>
                         </td>
                       </tr>
                     ) : (
                       filteredEmployees.map((emp) => (
                         <tr key={emp.id} className="bg-slate-50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-700/80 transition-all rounded-3xl shadow-sm hover:shadow-md group flex flex-col md:table-row mb-4 md:mb-0">
                           <td className="px-6 py-4 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium">
                                  {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                </div>
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {emp.firstName} {emp.lastName}
                                </div>
                              </div>
                           </td>
                           <td className="px-6 py-2 md:py-4 text-slate-500 font-mono text-xs">{emp.empId}</td>
                           <td className="px-6 py-2 md:py-4">
                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-yellow-800 dark:text-yellow-200">
                               <span className="w-1.5 h-1.5 rounded-full bg-accent mr-2"></span>
                               {emp.departmentName}
                             </span>
                           </td>
                           <td className="px-6 py-2 md:py-4">
                             <div className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0">
                               <span className="text-slate-800 dark:text-slate-200 font-medium">${emp.salary.toLocaleString()}</span>
                               <span className="text-slate-400 text-xs">{calculateAge(emp.dateOfBirth)} yrs</span>
                             </div>
                           </td>
                           {role === 'ADMIN' && (
                             <td className="px-6 py-4 text-right rounded-b-3xl md:rounded-r-3xl md:rounded-bl-none flex justify-end">
                               <div className="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => { setSelectedEmployee(emp); setIsEmployeeModalOpen(true); }}
                                   className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-600 rounded-full transition-colors"
                                   title="Edit"
                                 >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                 </button>
                                 <button 
                                   onClick={() => { setEmployeeToDelete(emp); setIsDeleteModalOpen(true); }}
                                   className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                   title="Delete"
                                 >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 </button>
                               </div>
                             </td>
                           )}
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </div>

          </div>
        </div>
      </div>

      <EmployeeModal 
        isOpen={isEmployeeModalOpen} 
        onClose={() => setIsEmployeeModalOpen(false)} 
        initialData={selectedEmployee}
        title={selectedEmployee ? 'Edit Employee' : 'Add Employee'}
        onSave={handleSaveEmployee}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        employeeName={employeeToDelete ? `${employeeToDelete.firstName} ${employeeToDelete.lastName}` : ''}
      />

    </div>
  );
}
