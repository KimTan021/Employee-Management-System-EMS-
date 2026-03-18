import React from 'react';
import { BaseModal } from './BaseModal';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-rose-500" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 dark:shadow-rose-900/20';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 dark:shadow-amber-900/20';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-emerald-900/20';
      default:
        return 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-slate-200 dark:shadow-none';
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-bold transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${getButtonClass()}`}
          >
            {isLoading && <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4">
        <div className={`w-16 h-16 rounded-3xl mb-4 flex items-center justify-center ${
          variant === 'danger' ? 'bg-rose-50 dark:bg-rose-900/20' :
          variant === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
          variant === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
          'bg-blue-50 dark:bg-blue-900/20'
        }`}>
          {getIcon()}
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed px-4">
          {message}
        </p>
      </div>
    </BaseModal>
  );
};
