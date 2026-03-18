import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from './ToastContext';
import { BaseModal } from './ui/BaseModal';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface UserAccount {
  id: number;
  username: string;
  role: string;
  employeeId: number | null;
  employeeName: string | null;
}

interface Employee {
  id: number;
  empId: string;
  firstName: string;
  lastName: string;
}

export default function UserManagement() {
  const { username: currentUsername, role: currentUserRole } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({ 
    employeeId: '', 
    username: '', 
    password: '', 
    role: 'EMPLOYEE' 
  });
  const [newPassword, setNewPassword] = useState('');

  // Confirmation state
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Fetch Users
  const { data: users = [], isLoading } = useQuery<UserAccount[]>({
    queryKey: ['users'],
    queryFn: async () => { const { data } = await api.get('/admin/users'); return data; },
  });

  // Fetch Employees (for linking)
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => { const { data } = await api.get('/employees'); return data; },
  });

  // Employees that don't have an account yet
  const unlinkedEmployees = employees.filter(
    emp => !users.some(u => u.employeeId === emp.id)
  );

  // Create User Mutation
  const createUser = useMutation({
    mutationFn: (payload: any) => api.post('/admin/users', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      setCreateForm({ employeeId: '', username: '', password: '', role: 'EMPLOYEE' });
      showToast('Account created successfully', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.message || err.response?.data?.details?.[0] || 'Error creating account', 'error'),
  });

  // Delete User Mutation
  const deleteUser = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('Account deleted', 'info');
      setConfirmation(prev => ({ ...prev, isOpen: false }));
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error deleting account', 'error'),
  });

  // Reset Password Mutation
  const resetPassword = useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      api.put(`/admin/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsResetModalOpen(false);
      setNewPassword('');
      showToast('Password reset successfully', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Error resetting password', 'error'),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({
      employeeId: createForm.employeeId ? Number(createForm.employeeId) : null,
      username: createForm.username,
      password: createForm.password,
      role: createForm.role,
    });
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      HR_MANAGER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      EMPLOYEE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[role] || 'bg-slate-100 text-slate-800'}`}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">User Accounts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{users.length} accounts registered</p>
        </div>
        {currentUserRole === 'ADMIN' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-full text-sm font-medium transition-colors shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Create Account
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-100/50 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-medium uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Linked Employee</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading accounts...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No user accounts found.</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.username}</td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {user.employeeName ? (
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                            {user.employeeName.charAt(0)}
                          </span>
                          {user.employeeName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {currentUserRole === 'ADMIN' && (
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {/* Only show reset if target is not admin, OR if target is self */}
                          {(user.role !== 'ADMIN' || user.username === currentUsername) && (
                            <button
                              onClick={() => { setSelectedUserId(user.id); setIsResetModalOpen(true); }}
                              className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full transition-colors"
                              title="Reset Password"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            </button>
                          )}
                          {/* Only show delete if target is not admin */}
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => {
                                setConfirmation({
                                  isOpen: true,
                                  title: 'Delete Account',
                                  message: `Are you sure you want to permanently delete the account for "${user.username}"? This action cannot be undone.`,
                                  onConfirm: () => deleteUser.mutate(user.id)
                                });
                              }}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                              title="Delete Account"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create User Account"
        maxWidth="lg"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button 
              type="button" 
              onClick={() => setIsCreateModalOpen(false)}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              form="create-user-form"
              type="submit" 
              disabled={createUser.isPending}
              className="px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {createUser.isPending ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        }
      >
        <form id="create-user-form" onSubmit={handleCreateSubmit} className="space-y-4 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fields marked <span className="text-red-500" aria-hidden="true">*</span> are required.
          </p>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Link to Employee (Optional)</label>
            <select
              value={createForm.employeeId}
              onChange={e => setCreateForm({ ...createForm, employeeId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 rounded-2xl text-slate-700 dark:text-white focus:ring-4 focus:ring-slate-500/5 outline-none transition-all"
            >
              <option value="">-- No employee link --</option>
              {unlinkedEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.empId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Username <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              required
              value={createForm.username}
              onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 rounded-2xl text-slate-700 dark:text-white focus:ring-4 focus:ring-slate-500/5 outline-none transition-all"
              placeholder="e.g. john.doe"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Initial Password <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              required
              type="password"
              minLength={6}
              value={createForm.password}
              onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 rounded-2xl text-slate-700 dark:text-white focus:ring-4 focus:ring-slate-500/5 outline-none transition-all"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Role <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              required
              value={createForm.role}
              onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 rounded-2xl text-slate-700 dark:text-white focus:ring-4 focus:ring-slate-500/5 outline-none transition-all"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </form>
      </BaseModal>

      <BaseModal
        isOpen={isResetModalOpen}
        onClose={() => { setIsResetModalOpen(false); setNewPassword(''); }}
        title="Reset Password"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button 
              type="button" 
              onClick={() => { setIsResetModalOpen(false); setNewPassword(''); }}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              form="reset-password-form"
              type="submit" 
              disabled={resetPassword.isPending}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        }
      >
        <form id="reset-password-form" onSubmit={(e) => { e.preventDefault(); if(selectedUserId) resetPassword.mutate({ id: selectedUserId, newPassword }); }} className="space-y-4 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter a new password for this user. They will be required to use this password on their next login.
          </p>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              New Password <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              required
              type="password"
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 rounded-2xl text-slate-700 dark:text-white focus:ring-4 focus:ring-slate-500/5 outline-none transition-all"
              placeholder="Min 6 characters"
              autoFocus
            />
          </div>
        </form>
      </BaseModal>

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        isLoading={deleteUser.isPending}
      />
    </div>
  );
}
