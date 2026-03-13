import React, { useState, useEffect, useRef } from 'react';

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
    departmentName: 'Engineering',
    salary: ''
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
        departmentName: initialData.departmentName || 'Engineering',
        salary: initialData.salary ? initialData.salary.toString() : ''
      });
    } else {
      setFormData({ empId: '', firstName: '', lastName: '', dateOfBirth: '', departmentName: 'Engineering', salary: '' });
    }
  }, [initialData, isOpen]);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;
    firstInputRef.current?.focus();

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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, salary: parseFloat(formData.salary) });
  };

  const inputClass = "w-full px-4 py-3 bg-slate-100/80 dark:bg-slate-900/50 border-none rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-accent outline-none transition-all shadow-inner text-sm";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div ref={modalRef} className="modal-enter w-full max-w-md bg-white/90 dark:bg-slate-800/95 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/50 dark:border-slate-700/50">
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close modal" className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className={labelClass}>Employee ID</label>
            <input ref={firstInputRef} required type="text" name="empId" value={formData.empId} onChange={handleChange}
                   className={inputClass} placeholder="EMP-001" disabled={!!initialData} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Date of Birth</label>
            <input required type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Department</label>
              <select name="departmentName" value={formData.departmentName} onChange={handleChange} className={inputClass + " cursor-pointer appearance-none"}>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Salary ($)</label>
              <input required type="number" step="0.01" min="0" name="salary" value={formData.salary} onChange={handleChange} className={inputClass} placeholder="0.00" />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
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
