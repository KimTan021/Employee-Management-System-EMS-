import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { BaseModal } from './ui/BaseModal';

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
  const [ageError, setAgeError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emergencyPhoneError, setEmergencyPhoneError] = useState<string | null>(null);

  const { data: departments = [], isLoading: departmentsLoading } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data;
    },
  });

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
    setAgeError(null);
    setPhoneError(null);
    setEmergencyPhoneError(null);
  }, [initialData, isOpen, departments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePhilippinesPhone = (phone: string) => {
    if (!phone) return true;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+63|0)[2-9]\d{7,10}$/.test(cleanPhone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Age validation
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    let hasError = false;

    if (age < 18) {
      setAgeError("Employee must be at least 18 years old.");
      hasError = true;
    } else {
      setAgeError(null);
    }

    if (!validatePhilippinesPhone(formData.phone)) {
      setPhoneError("Please enter a valid Philippines phone number (e.g. 0917 123 4567)");
      hasError = true;
    } else {
      setPhoneError(null);
    }

    if (!validatePhilippinesPhone(formData.emergencyContactPhone)) {
      setEmergencyPhoneError("Please enter a valid Philippines phone number (e.g. 0917 123 4567)");
      hasError = true;
    } else {
      setEmergencyPhoneError(null);
    }

    if (hasError) {
      // Focus the first error
      if (age < 18) document.getElementsByName('dateOfBirth')[0]?.focus();
      else if (!validatePhilippinesPhone(formData.phone)) document.getElementsByName('phone')[0]?.focus();
      else if (!validatePhilippinesPhone(formData.emergencyContactPhone)) document.getElementsByName('emergencyContactPhone')[0]?.focus();
      return;
    }

    onSave({
      ...formData,
      salary: parseFloat(formData.salary),
      annualLeaveBalance: formData.annualLeaveBalance ? parseInt(formData.annualLeaveBalance, 10) : null,
      sickLeaveBalance: formData.sickLeaveBalance ? parseInt(formData.sickLeaveBalance, 10) : null,
      personalLeaveBalance: formData.personalLeaveBalance ? parseInt(formData.personalLeaveBalance, 10) : null
    });
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none transition-all text-sm";
  const labelClass = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="lg"
      isLoading={departmentsLoading}
      footer={
        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="employee-form"
            disabled={isLoading}
            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-bold shadow-lg shadow-slate-900/10 dark:shadow-none hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
            ) : 'Save Record'}
          </button>
        </div>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Core Identity
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Fields with * are required</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Employee ID *</label>
              <input required type="text" name="empId" value={formData.empId} onChange={handleChange}
                     className={inputClass} placeholder="e.g. EMP-101" disabled={!!initialData} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth *</label>
              <input required type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={(e) => { handleChange(e); setAgeError(null); }} 
                     className={cn(inputClass, ageError ? "border-rose-500 ring-rose-500/10" : "")} />
              {ageError && <p className="text-[10px] font-bold text-rose-500 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">{ageError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name *</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} placeholder="e.g. Juan" />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} placeholder="e.g. Dela Cruz" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Department *</label>
              <select required name="departmentName" value={formData.departmentName} onChange={handleChange} 
                      className={cn(inputClass, "appearance-none cursor-pointer")}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
              >
                {departments.length === 0 && <option value="">No departments</option>}
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Base Salary ($) *</label>
              <input required type="number" step="0.01" min="0" name="salary" value={formData.salary} onChange={handleChange} className={inputClass} placeholder="0.00" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Contact & Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" name="phone" value={formData.phone} 
                     onChange={(e) => { handleChange(e); setPhoneError(null); }} 
                     className={cn(inputClass, phoneError ? "border-rose-500 ring-rose-500/10" : "")} 
                     placeholder="e.g. 0917 123 4567" />
              {phoneError && <p className="text-[10px] font-bold text-rose-500 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">{phoneError}</p>}
            </div>
            <div>
              <label className={labelClass}>Emergency Phone</label>
              <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} 
                     onChange={(e) => { handleChange(e); setEmergencyPhoneError(null); }} 
                     className={cn(inputClass, emergencyPhoneError ? "border-rose-500 ring-rose-500/10" : "")}
                     placeholder="e.g. 0917 123 4567" />
              {emergencyPhoneError && <p className="text-[10px] font-bold text-rose-500 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">{emergencyPhoneError}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>Home Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="e.g. 123 Makati Ave, Manila" />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Policy Entitlements
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Annual Leave</label>
              <input type="number" min="0" name="annualLeaveBalance" value={formData.annualLeaveBalance} onChange={handleChange} className={inputClass} placeholder="e.g. 15" />
            </div>
            <div>
              <label className={labelClass}>Sick Leave</label>
              <input type="number" min="0" name="sickLeaveBalance" value={formData.sickLeaveBalance} onChange={handleChange} className={inputClass} placeholder="e.g. 10" />
            </div>
            <div>
              <label className={labelClass}>Personal Leave</label>
              <input type="number" min="0" name="personalLeaveBalance" value={formData.personalLeaveBalance} onChange={handleChange} className={inputClass} placeholder="e.g. 5" />
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
