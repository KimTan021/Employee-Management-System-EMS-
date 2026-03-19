import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from './ToastContext';
import { useAuthStore } from '../store/useAuthStore';
import { BaseModal } from './ui/BaseModal';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { ENDPOINTS } from '../constants/api';
import { MESSAGES } from '../constants/messages';

interface Document {
  id: number;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export default function DocumentModal({ isOpen, onClose, employeeId, employeeName }: { isOpen: boolean, onClose: () => void, employeeId?: number, employeeName: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { role, username } = useAuthStore();
  const maxUploadBytes = 10 * 1024 * 1024;

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; documentId: number | null; fileName: string }>({
    isOpen: false,
    documentId: null,
    fileName: ''
  });

  // Fetch Documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents', employeeId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.DOCUMENTS.EMPLOYEE(employeeId!));
      return data;
    },
    enabled: isOpen && !!employeeId,
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!employeeId) throw new Error(MESSAGES.VALIDATION.MISSING_EMP_ID || 'Missing employee id');
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(ENDPOINTS.DOCUMENTS.BASE(employeeId), formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', employeeId] });
      showToast(MESSAGES.DOCUMENT.UPLOAD_SUCCESS, 'success');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || MESSAGES.DOCUMENT.UPLOAD_ERROR;
      showToast(message, 'error');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await api.delete(ENDPOINTS.DOCUMENTS.DELETE(documentId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', employeeId] });
      showToast(MESSAGES.DOCUMENT.DELETE_SUCCESS, 'info');
    },
    onError: (err: any) => showToast(err.response?.data?.message || MESSAGES.DOCUMENT.DELETE_ERROR, 'error')
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (!employeeId) {
        showToast(MESSAGES.VALIDATION.MISSING_EMP_ID || 'Cannot upload: missing employee id', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (e.target.files[0].size > maxUploadBytes) {
        showToast(MESSAGES.DOCUMENT.FILE_TOO_LARGE, 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setIsUploading(true);
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await api.get(ENDPOINTS.DOCUMENTS.DOWNLOAD(doc.id), { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showToast(MESSAGES.DOCUMENT.DOWNLOAD_ERROR, 'error');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`${employeeName} - ${MESSAGES.UI.DOCUMENT_MODAL.TITLE}`}
      maxWidth="xl"
      isLoading={isLoading}
      footer={
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-bold transition-all"
          >
            {MESSAGES.UI.COMMON.CLOSE}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{employeeName}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Dossier Account</p>
          </div>
        </div>

        {(role === 'ADMIN' || role === 'HR_MANAGER') && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{MESSAGES.UI.DOCUMENT_MODAL.SECURE_UPLOAD}</h3>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
              disabled={isUploading}
            />
            <button
              onClick={() => !isUploading && fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full group relative overflow-hidden border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all ${
                isUploading
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                  : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-900/30 dark:bg-blue-900/10 cursor-pointer'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                {isUploading ? (
                  <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                )}
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{isUploading ? MESSAGES.UI.DOCUMENT_MODAL.UPLOADING : MESSAGES.UI.DOCUMENT_MODAL.SELECT_FILES}</span>
                <span className="text-[10px] font-medium text-slate-400">{MESSAGES.UI.DOCUMENT_MODAL.UPLOAD_NEW}</span>
              </div>
            </button>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{MESSAGES.UI.DOCUMENT_MODAL.ARCHIVE_TITLE}</h3>
          {isLoading ? (
            <div className="text-center py-20">{MESSAGES.UI.COMMON.LOADING_RECORDS}...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{MESSAGES.UI.DOCUMENT_MODAL.NO_DOCS}</p>
            </div>
          ) : (
            <div className="overflow-hidden bg-white/50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{MESSAGES.UI.DOCUMENT_MODAL.COL_FILE_NAME}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{MESSAGES.UI.DOCUMENT_MODAL.COL_TYPE}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{MESSAGES.UI.DOCUMENT_MODAL.COL_UPLOADED_BY}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{MESSAGES.UI.DOCUMENT_MODAL.COL_UPLOADED_AT}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{MESSAGES.UI.COMMON.ACTIONS}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{doc.fileName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{doc.fileType}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{doc.uploadedBy}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(doc.uploadedAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                            title={MESSAGES.UI.DOCUMENT_MODAL.DOWNLOAD_TOOLTIP}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                          {(role === 'ADMIN' || (role === 'HR_MANAGER' && doc.uploadedBy === username)) && (
                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  isOpen: true,
                                  documentId: doc.id,
                                  fileName: doc.fileName
                                });
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                              title={MESSAGES.UI.DOCUMENT_MODAL.DELETE_TOOLTIP}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (deleteConfirm.documentId) {
            deleteMutation.mutate(deleteConfirm.documentId);
            setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
          }
        }}
        title={MESSAGES.UI.DOCUMENT_MODAL.DELETE_CONFIRM_TITLE}
        message={`${MESSAGES.UI.DOCUMENT_MODAL.DELETE_CONFIRM_BODY} ("${deleteConfirm.fileName}")`}
        confirmLabel={MESSAGES.UI.COMMON.DELETE}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </BaseModal>
  );
}
