import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from './ToastContext';
import { BaseModal } from './ui/BaseModal';

export default function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const changePassword = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) => api.put('/portal/change-password', payload),
    onSuccess: () => {
      showToast('Password updated successfully', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.response?.data?.details?.[0] || 'Verification failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    changePassword.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none transition-all text-sm";
  const labelClass = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => { setError(''); onClose(); }}
      title="Security Verification"
      maxWidth="sm"
      footer={
        <button 
          type="submit" 
          form="password-form"
          disabled={changePassword.isPending}
          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-bold shadow-lg shadow-slate-900/10 dark:shadow-none hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {changePassword.isPending ? (
            <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : 'Commit Changes'}
        </button>
      }
    >
      <form id="password-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
           <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           </div>
           <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Password Update</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Identity Shield</p>
           </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Current Password *</label>
            <input
              required
              type="password"
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
          <div>
            <label className={labelClass}>New Secret Password *</label>
            <input
              required
              type="password"
              minLength={6}
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              className={inputClass}
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className={labelClass}>Validate Password *</label>
            <input
              required
              type="password"
              minLength={6}
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
