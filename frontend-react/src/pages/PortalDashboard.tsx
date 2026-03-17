import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useModalBehavior } from '../components/shared/useModalBehavior';

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

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileChangeModalOpen, setIsProfileChangeModalOpen] = useState(false);
  const leaveModalRef = useRef<HTMLDivElement>(null);
  const leaveInitialFocusRef = useRef<HTMLInputElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);
  const profileInitialFocusRef = useRef<HTMLInputElement>(null);
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

  useModalBehavior({ isOpen: isLeaveModalOpen, onClose: () => setIsLeaveModalOpen(false), modalRef: leaveModalRef, initialFocusRef: leaveInitialFocusRef });
  useModalBehavior({ isOpen: isProfileChangeModalOpen, onClose: () => setIsProfileChangeModalOpen(false), modalRef: profileModalRef, initialFocusRef: profileInitialFocusRef });

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
    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      showToast('End date must be on or after the start date.', 'error');
      return;
    }
    if (!leaveForm.type) {
      showToast('Please select a leave type.', 'error');
      return;
    }

    submitLeave.mutate(leaveForm);
  };

  const handleProfileChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        days.add(key);
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
      const dateKey = new Date(year, month, day).toISOString().split('T')[0];
      cells.push({ day, dateKey });
    }
    return { year, month, cells };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8">
      
      {/* Top Header */}
      <div className="max-w-5xl mx-auto flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm mb-8 border border-slate-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Employee Portal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, {profile?.firstName || username}!</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsChangePasswordOpen(true)}
            className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-200 rounded-lg text-sm font-medium transition-colors"
          >
            Change Password
          </button>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">My Official Record</h2>
          {profileLoading ? (
            <p className="text-slate-500">Loading profile data...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Employee ID</p>
                 <p className="font-medium text-slate-900 dark:text-white">{profile?.empId}</p>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Full Name</p>
                 <p className="font-medium text-slate-900 dark:text-white">{profile?.firstName} {profile?.lastName}</p>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Department</p>
                 <p className="font-medium text-slate-900 dark:text-white">{profile?.departmentName}</p>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Base Salary</p>
                 <p className="font-medium text-slate-900 dark:text-white">${profile?.salary.toLocaleString()}</p>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Phone</p>
                 <p className="font-medium text-slate-900 dark:text-white">{profile?.phone || '-'}</p>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Address</p>
                 <p className="font-medium text-slate-900 dark:text-white">{profile?.address || '-'}</p>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Emergency Contact</p>
                 <p className="font-medium text-slate-900 dark:text-white">{profile?.emergencyContactName || '-'}</p>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Emergency Phone</p>
                 <p className="font-medium text-slate-900 dark:text-white">{profile?.emergencyContactPhone || '-'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Leave Balance + Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Leave Balance</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Annual', remaining: leaveBalance?.annualRemaining ?? 0, used: leaveBalance?.annualUsed ?? 0 },
                { label: 'Sick', remaining: leaveBalance?.sickRemaining ?? 0, used: leaveBalance?.sickUsed ?? 0 },
                { label: 'Personal', remaining: leaveBalance?.personalRemaining ?? 0, used: leaveBalance?.personalUsed ?? 0 },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">{item.label}</p>
                  <p className="text-2xl font-semibold text-slate-800 dark:text-white">{item.remaining}</p>
                  <p className="text-xs text-slate-400">Used: {item.used}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Leave Calendar</h2>
            <div className="grid grid-cols-7 gap-2 text-xs text-center text-slate-500 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-sm">
              {calendar.cells.map((cell, idx) => {
                if (!cell.day) return <div key={idx} className="h-8" />;
                const isLeave = cell.dateKey ? approvedLeaveDays.has(cell.dateKey) : false;
                return (
                  <div
                    key={idx}
                    className={`h-8 flex items-center justify-center rounded-lg ${isLeave ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'}`}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leave Requests Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Leave Requests</h2>
            <button 
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Request Time Off
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {leavesLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading requests...</td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No leave requests found</td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{leave.startDate}</td>
                      <td className="px-6 py-4 font-medium">{leave.endDate}</td>
                      <td className="px-6 py-4">{leave.type}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{leave.reason}</td>
                      <td className="px-6 py-4">{getStatusBadge(leave.status)}</td>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* My Documents Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">My Documents</h2>
            </div>
            <div className="p-0">
              {documentsLoading ? (
                <div className="p-6 text-center text-slate-500 italic">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic">No documents available</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-[200px]" title={doc.fileName}>{doc.fileName}</p>
                          <p className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Profile History</h2>
            </div>
            <div className="p-0">
              {auditLogsLoading ? (
                <div className="p-6 text-center text-slate-500 italic">Loading history...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic">No history found</div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-white dark:bg-slate-800">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.changedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {log.action === 'UPDATE' ? (
                          <>Changed from <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">{log.oldValue || 'None'}</span> to <span className="font-mono text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1 rounded">{log.newValue}</span></>
                        ) : (
                          <span>Status changed by {log.changedBy}</span>
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
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsLeaveModalOpen(false); }}>
          <div ref={leaveModalRef} className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Request Leave</h2>
            </div>
            
            <form onSubmit={handleLeaveSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fields marked <span className="text-red-500" aria-hidden="true">*</span> are required.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input ref={leaveInitialFocusRef} required type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} 
                         className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input required type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})}  
                         className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <select required value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Sick">Sick Leave</option>
                  <option value="Vacation">Vacation / Annual Leave</option>
                  <option value="Personal">Personal Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (Optional)</label>
                <textarea rows={3} value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} 
                       className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setIsLeaveModalOpen(false)} 
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitLeave.isPending}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50">
                  {submitLeave.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Change Request Modal */}
      {isProfileChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsProfileChangeModalOpen(false); }}>
          <div ref={profileModalRef} className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Request Profile Update</h2>
            </div>
            <form onSubmit={handleProfileChangeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input
                  ref={profileInitialFocusRef}
                  type="text"
                  value={profileChangeForm.phone}
                  onChange={e => setProfileChangeForm({ ...profileChangeForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={profileChangeForm.address}
                  onChange={e => setProfileChangeForm({ ...profileChangeForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={profileChangeForm.emergencyContactName}
                    onChange={e => setProfileChangeForm({ ...profileChangeForm, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={profileChangeForm.emergencyContactPhone}
                    onChange={e => setProfileChangeForm({ ...profileChangeForm, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setIsProfileChangeModalOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitProfileChange.isPending}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50">
                  {submitProfileChange.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />

    </div>
  );
}
