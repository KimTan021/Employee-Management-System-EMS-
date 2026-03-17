import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: any) => void;
  initialData?: any;
  title: string;
  isLoading?: boolean;
}

export default function EmployeeModal({ isOpen, onClose, onSave, initialData, title, isLoading }: EmployeeModalProps) {
  const [formData, setFormData] = useState({
    empId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    departmentName: '',
    salary: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    annualLeaveBalance: '12',
    sickLeaveBalance: '10',
    personalLeaveBalance: '5'
  });

  const { data: departments = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data;
    },
  });

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        empId: initialData.empId || '',
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        dateOfBirth: initialData.dateOfBirth || '',
        departmentName: initialData.departmentName || (departments[0]?.name || ''),
        salary: initialData.salary ? initialData.salary.toString() : '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        emergencyContactName: initialData.emergencyContactName || '',
        emergencyContactPhone: initialData.emergencyContactPhone || '',
        annualLeaveBalance: initialData.annualLeaveBalance != null ? String(initialData.annualLeaveBalance) : '12',
        sickLeaveBalance: initialData.sickLeaveBalance != null ? String(initialData.sickLeaveBalance) : '10',
        personalLeaveBalance: initialData.personalLeaveBalance != null ? String(initialData.personalLeaveBalance) : '5'
      });
    } else {
      setFormData({
        empId: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        departmentName: departments[0]?.name || '',
        salary: '',
        phone: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        annualLeaveBalance: '12',
        sickLeaveBalance: '10',
        personalLeaveBalance: '5'
      });
    }
  }, [initialData, isOpen, departments]);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;
    firstInputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      salary: parseFloat(formData.salary),
      annualLeaveBalance: formData.annualLeaveBalance ? parseInt(formData.annualLeaveBalance, 10) : null,
      sickLeaveBalance: formData.sickLeaveBalance ? parseInt(formData.sickLeaveBalance, 10) : null,
      personalLeaveBalance: formData.personalLeaveBalance ? parseInt(formData.personalLeaveBalance, 10) : null
    });
  };

  const inputClass = "w-full px-4 py-3 bg-slate-100/80 dark:bg-slate-900/50 border-none rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-accent outline-none transition-all shadow-inner text-sm";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="modal-enter w-full max-w-lg max-h-[90vh] bg-white/90 dark:bg-slate-800/95 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/50 dark:border-slate-700/50 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close modal" className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-8 space-y-5 overflow-y-auto flex-1 min-h-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fields marked <span className="text-red-500" aria-hidden="true">*</span> are required.
            </p>
            <div>
              <label className={labelClass}>
                Employee ID <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input ref={firstInputRef} required type="text" name="empId" value={formData.empId} onChange={handleChange}
                     className={inputClass} placeholder="EMP-001" disabled={!!initialData} />
            </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                First Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>
                Last Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Date of Birth <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input required type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Department <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select required name="departmentName" value={formData.departmentName} onChange={handleChange} className={inputClass + " cursor-pointer appearance-none"}>
                {departments.length === 0 && <option value="">No departments</option>}
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Salary ($) <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input required type="number" step="0.01" min="0" name="salary" value={formData.salary} onChange={handleChange} className={inputClass} placeholder="0.00" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Contact Info</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="e.g. +63 900 000 0000" />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="Street, City, Province" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Emergency Contact</label>
                  <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className={inputClass} placeholder="Full name" />
                </div>
                <div>
                  <label className={labelClass}>Emergency Phone</label>
                  <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className={inputClass} placeholder="Phone number" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Leave Balances</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Annual</label>
                <input type="number" min="0" name="annualLeaveBalance" value={formData.annualLeaveBalance} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Sick</label>
                <input type="number" min="0" name="sickLeaveBalance" value={formData.sickLeaveBalance} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Personal</label>
                <input type="number" min="0" name="personalLeaveBalance" value={formData.personalLeaveBalance} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>
          </div>

          <div className="px-8 py-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shrink-0">
            <button type="button" onClick={onClose}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-2xl font-medium transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-2xl font-medium transition-colors shadow-md text-sm flex items-center gap-2 disabled:opacity-50">
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Saving...
                </>
              ) : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
