import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { BaseModal } from '../components/ui/BaseModal';
import { useTheme } from '../components/theme-provider';
import { cn, formatDateKey, parseLocalDate } from '../lib/utils';

// Types
interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reason: string;
}

interface EmployeeProfile {
  id: number;
  empId: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  salary: number;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

interface DocumentInfo {
  id: number;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface AuditLog {
  id: number;
  action: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
  changedBy: string;
}

interface LeaveBalance {
  annualEntitled: number;
  sickEntitled: number;
  personalEntitled: number;
  annualUsed: number;
  sickUsed: number;
  personalUsed: number;
  annualRemaining: number;
  sickRemaining: number;
  personalRemaining: number;
}

interface ProfileChangeRequest {
  id: number;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  status: string;
  createdAt: string;
}

export default function PortalDashboard() {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileChangeModalOpen, setIsProfileChangeModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    type: 'Sick',
    reason: ''
  });
  const [profileChangeForm, setProfileChangeForm] = useState({
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});


  // Fetch Profile
  const { data: profile, isLoading: profileLoading } = useQuery<EmployeeProfile>({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const { data } = await api.get('/portal/me');
      return data;
    },
  });

  // Fetch Leaves
  const { data: leaves = [], isLoading: leavesLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['myLeaves'],
    queryFn: async () => {
      const { data } = await api.get('/portal/leaves');
      return data;
    },
  });

  // Fetch Leave Balance
  const { data: leaveBalance } = useQuery<LeaveBalance>({
    queryKey: ['myLeaveBalance'],
    queryFn: async () => {
      const { data } = await api.get('/portal/leave-balance');
      return data;
    },
  });

  // Fetch Documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<DocumentInfo[]>({
    queryKey: ['myDocuments'],
    queryFn: async () => {
      const { data } = await api.get('/portal/documents');
      return data;
    },
  });

  // Fetch Audit Logs
  const { data: auditLogs = [], isLoading: auditLogsLoading } = useQuery<AuditLog[]>({
    queryKey: ['myAuditLogs'],
    queryFn: async () => {
      const { data } = await api.get('/portal/audit');
      return data;
    },
  });

  // Fetch Profile Change Requests
  const { data: profileChanges = [], isLoading: profileChangesLoading } = useQuery<ProfileChangeRequest[]>({
    queryKey: ['myProfileChanges'],
    queryFn: async () => {
      const { data } = await api.get('/portal/profile-changes');
      return data;
    },
  });

  // Submit Leave Mutation
  const submitLeave = useMutation({
    mutationFn: (newLeave: any) => api.post('/portal/leaves', newLeave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      setIsLeaveModalOpen(false);
      setLeaveForm({ startDate: '', endDate: '', type: 'Sick', reason: '' });
      showToast('Leave request submitted', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.details?.[0] || 'Error submitting leave', 'error')
  });

  const submitProfileChange = useMutation({
    mutationFn: (payload: any) => api.post('/portal/profile-changes', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfileChanges'] });
      setIsProfileChangeModalOpen(false);
      showToast('Profile update request submitted', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error submitting request', 'error'),
  });

  // Change password handled by shared modal

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (profile) {
      setProfileChangeForm({
        phone: profile.phone || '',
        address: profile.address || '',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || ''
      });
    }
  }, [profile]);

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveForm.startDate || !leaveForm.endDate) {
      showToast('Please select both start and end dates.', 'error');
      return;
    }

    const today = formatDateKey(new Date());
    if (leaveForm.startDate < today) {
      showToast('Leave start date cannot be in the past.', 'error');
      return;
    }

    if (leaveForm.endDate < leaveForm.startDate) {
      showToast('End date must be on or after the start date.', 'error');
      return;
    }

    if (!leaveForm.type) {
      showToast('Please select a leave type.', 'error');
      return;
    }

    submitLeave.mutate(leaveForm);
  };

  const validatePhPhone = (phone: string) => {
    if (!phone) return true;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+63|0)[2-9]\d{7,10}$/.test(cleanPhone);
  };

  const handleProfileChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (!validatePhPhone(profileChangeForm.phone)) {
      errors.phone = "Invalid Philippines phone format.";
    }
    if (!validatePhPhone(profileChangeForm.emergencyContactPhone)) {
      errors.emergencyContactPhone = "Invalid Philippines phone format.";
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    submitProfileChange.mutate(profileChangeForm);
  };

  // Change password handled by shared modal

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</span>;
      case 'REJECTED': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</span>;
      default: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>;
    }
  };

  const handleDownloadDocument = async (docId: number, fileName: string) => {
    try {
      const response = await api.get(`/portal/documents/download/${docId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('Error downloading document', 'error');
    }
  };

  const approvedLeaveDays = useMemo(() => {
    const days = new Set<string>();
    leaves.filter(l => l.status === 'APPROVED').forEach(l => {
      const start = parseLocalDate(l.startDate);
      const end = parseLocalDate(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.add(formatDateKey(d));
      }
    });
    return days;
  }, [leaves]);

  const calendar = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();
    const cells: { day: number | null; dateKey?: string }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(new Date(year, month, day));
      cells.push({ day, dateKey });
    }
    return { year, month, cells };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2f6] via-[#fdfaf4] to-[#faedd0] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300">
      
      {/* Top Navigation Bar */}
      <div className="max-w-[1400px] mx-auto bg-white/70 backdrop-blur-md dark:bg-slate-800/80 p-3 rounded-full shadow-sm flex items-center justify-between mb-8 border border-white/40 dark:border-slate-700/50">
        <div className="flex items-center gap-2 pl-4">
          <div className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">EMS<span className="text-indigo-500 text-3xl leading-[0]">.</span></div>
          <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium ml-1">Portal</span>
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
            <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {(profile?.firstName || username)?.charAt(0).toUpperCase()}
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

      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Welcome Section */}
        <div className="mb-4">
          <h1 className="text-4xl md:text-5xl font-light font-display tracking-tight text-slate-800 dark:text-white mb-2">
            Welcome, <span className="font-semibold">{profile?.firstName || username}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Here's an overview of your employee record and leave status.</p>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Record Card */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              My Official Record
            </h2>
            {profileLoading ? (
              <div className="py-12 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: 'Employee ID', value: profile?.empId, mono: true },
                  { label: 'Department', value: profile?.departmentName },
                  { label: 'Base Salary', value: `$${profile?.salary.toLocaleString()}` },
                  { label: 'Phone', value: profile?.phone },
                  { label: 'Address', value: profile?.address, full: true },
                  { label: 'Emergency Contact', value: profile?.emergencyContactName },
                  { label: 'Emergency Phone', value: profile?.emergencyContactPhone },
                ].map(item => (
                  <div key={item.label} className={item.full ? "sm:col-span-2" : ""}>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">{item.label}</p>
                    <p className={`font-medium text-slate-800 dark:text-slate-200 ${item.mono ? 'font-mono' : ''}`}>{item.value || '-'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile Actions Card */}
          <div className="lg:col-span-4 bg-slate-900 dark:bg-slate-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-display font-semibold mb-2">Need to update your details?</h3>
              <p className="text-indigo-200/70 text-sm mb-6">Request changes to your contact or emergency information.</p>
            </div>
            <button
              onClick={() => setIsProfileChangeModalOpen(true)}
              className="relative z-10 w-full py-4 bg-white text-slate-900 hover:bg-indigo-50 rounded-2xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 group"
            >
              Update Profile
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>

        {/* Leave Balance + Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold font-display text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Leave Balance
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Annual', remaining: leaveBalance?.annualRemaining ?? 0, used: leaveBalance?.annualUsed ?? 0, color: 'indigo' },
                { label: 'Sick', remaining: leaveBalance?.sickRemaining ?? 0, used: leaveBalance?.sickUsed ?? 0, color: 'rose' },
                { label: 'Personal', remaining: leaveBalance?.personalRemaining ?? 0, used: leaveBalance?.personalUsed ?? 0, color: 'amber' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs uppercase tracking-tighter text-slate-400 font-bold mb-2">{item.label}</p>
                  <p className="text-4xl font-light font-display text-slate-900 dark:text-white mb-1">{item.remaining}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Used: {item.used}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold font-display text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Leave Calendar
            </h2>
            <div className="grid grid-cols-7 gap-2 text-[10px] uppercase tracking-widest text-center text-slate-400 font-bold mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-sm">
              {calendar.cells.map((cell, idx) => {
                if (!cell.day) return <div key={idx} className="h-10" />;
                const isLeave = cell.dateKey ? approvedLeaveDays.has(cell.dateKey) : false;
                const isToday = cell.dateKey === formatDateKey(new Date());
                return (
                  <div
                    key={idx}
                    className={cn(
                      "h-10 flex items-center justify-center rounded-xl transition-all font-medium",
                      isLeave ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 
                      isToday ? 'bg-accent text-slate-900 shadow-lg shadow-accent/20' :
                      'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                    )}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Approved Leave</div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent"></span> Today</div>
            </div>
          </div>
        </div>

        {/* Leave Requests Section */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/20">
            <h2 className="text-xl font-semibold font-display text-slate-900 dark:text-white flex items-center gap-2">
               <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Leave Requests
            </h2>
            <button 
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 group"
            >
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Request Time Off
            </button>
          </div>
          
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest hidden md:table-header-group">
                <tr>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="md:table-row-group flex flex-col gap-4 md:gap-0">
                {leavesLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic"><div className="flex flex-col items-center gap-4"><div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div><p>Loading...</p></div></td></tr>
                ) : leaves.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No leave requests found</td></tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="bg-slate-50/50 hover:bg-white dark:bg-slate-900/30 dark:hover:bg-slate-900/60 transition-all rounded-2xl shadow-sm hover:shadow-md flex flex-col md:table-row group">
                      <td className="px-6 py-4 font-medium rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                         <span className="md:hidden text-[10px] uppercase text-slate-400 block mb-1">Start Date</span>
                         {leave.startDate}
                      </td>
                      <td className="px-6 py-2 md:py-4 font-medium">
                         <span className="md:hidden text-[10px] uppercase text-slate-400 block mb-1">End Date</span>
                         {leave.endDate}
                      </td>
                      <td className="px-6 py-2 md:py-4">
                         <span className="md:hidden text-[10px] uppercase text-slate-400 block mb-1">Type</span>
                         <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-medium border border-slate-100 dark:border-slate-800">{leave.type}</span>
                      </td>
                      <td className="px-6 py-2 md:py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                         <span className="md:hidden text-[10px] uppercase text-slate-400 block mb-1">Reason</span>
                         {leave.reason || '-'}
                      </td>
                      <td className="px-6 py-4 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
                         <span className="md:hidden text-[10px] uppercase text-slate-400 block mb-1">Status</span>
                         <StatusBadge status={leave.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Profile Change Requests */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Profile Update Requests</h2>
            <button
              onClick={() => setIsProfileChangeModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Request Update
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Emergency Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {profileChangesLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading requests...</td></tr>
                ) : profileChanges.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No profile update requests yet.</td></tr>
                ) : (
                  profileChanges.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">{req.phone || '-'}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={req.address || ''}>{req.address || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs">{req.emergencyContactName || '-'}</div>
                        <div className="text-xs text-slate-400">{req.emergencyContactPhone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Documents Section */}
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-semibold font-display text-slate-900 dark:text-white flex items-center gap-2">
                 <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 My Documents
              </h2>
            </div>
            <div className="p-0">
              {documentsLoading ? (
                <div className="p-8 text-center text-slate-500 italic">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">No documents available</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-[200px]" title={doc.fileName}>{doc.fileName}</p>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-tighter">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                        className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all shadow-sm"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profile History Section */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] shadow-xl border border-slate-800/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mt-16"></div>
            <div className="p-8 border-b border-slate-800 relative z-10">
              <h2 className="text-xl font-semibold font-display text-white flex items-center gap-2">
                 <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Profile History
              </h2>
            </div>
            <div className="p-0 relative z-10">
              {auditLogsLoading ? (
                <div className="p-8 text-center text-slate-500 italic">Loading history...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">No history found</div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-6 hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase">
                          {new Date(log.changedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {log.action === 'UPDATE' ? (
                          <>Changed from <span className="font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{log.oldValue || 'None'}</span> to <span className="font-mono text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">{log.newValue}</span></>
                        ) : (
                          <span className="italic opacity-80">Status updated by system</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Request Leave Modal */}
      <BaseModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Request Leave"
        isLoading={submitLeave.isPending}
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input required type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} 
                     className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input required type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})}  
                     className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Type <span className="text-rose-500">*</span>
            </label>
            <select required value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none">
              <option value="Sick">Sick Leave</option>
              <option value="Vacation">Vacation / Annual Leave</option>
              <option value="Personal">Personal Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Reason</label>
            <textarea rows={3} value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} 
                   placeholder="Briefly describe your request..."
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsLeaveModalOpen(false)} 
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-2xl font-semibold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitLeave.isPending}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
              Submit Request
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Profile Change Request Modal */}
      <BaseModal
        isOpen={isProfileChangeModalOpen}
        onClose={() => setIsProfileChangeModalOpen(false)}
        title="Request Profile Update"
        isLoading={submitProfileChange.isPending}
      >
        <form onSubmit={handleProfileChangeSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label>
            <input
              type="text"
              value={profileChangeForm.phone}
              placeholder="e.g. 0917 123 4567"
              onChange={e => {
                setProfileChangeForm({ ...profileChangeForm, phone: e.target.value });
                setProfileErrors(prev => ({ ...prev, phone: '' }));
              }}
              className={cn(
                "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                profileErrors.phone ? "border-rose-500 ring-rose-500/10" : "border-slate-100 dark:border-slate-700"
              )}
            />
            {profileErrors.phone && <p className="text-[10px] font-bold text-rose-500 mt-1.5 ml-1">{profileErrors.phone}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Address</label>
            <input
              type="text"
              value={profileChangeForm.address}
              placeholder="e.g. 123 Makati Ave, Manila"
              onChange={e => setProfileChangeForm({ ...profileChangeForm, address: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Emergency Contact</label>
              <input
                type="text"
                value={profileChangeForm.emergencyContactName}
                placeholder="e.g. Maria Clara"
                onChange={e => setProfileChangeForm({ ...profileChangeForm, emergencyContactName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Emergency Phone</label>
              <input
                type="text"
                value={profileChangeForm.emergencyContactPhone}
                placeholder="e.g. 0917 123 4567"
                onChange={e => {
                  setProfileChangeForm({ ...profileChangeForm, emergencyContactPhone: e.target.value });
                  setProfileErrors(prev => ({ ...prev, emergencyContactPhone: '' }));
                }}
                className={cn(
                  "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                  profileErrors.emergencyContactPhone ? "border-rose-500 ring-rose-500/10" : "border-slate-100 dark:border-slate-700"
                )}
              />
              {profileErrors.emergencyContactPhone && <p className="text-[10px] font-bold text-rose-500 mt-1.5 ml-1">{profileErrors.emergencyContactPhone}</p>}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsProfileChangeModalOpen(false)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-2xl font-semibold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitProfileChange.isPending}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
              Submit Request
            </button>
          </div>
        </form>
      </BaseModal>

      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />

    </div>
  );
}
