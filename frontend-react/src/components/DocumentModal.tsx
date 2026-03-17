import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from './ToastContext';
import { useAuthStore } from '../store/useAuthStore';
import { useModalBehavior } from './shared/useModalBehavior';

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
  const modalRef = useRef<HTMLDivElement>(null);

  useModalBehavior({ isOpen, onClose, modalRef });

  // Fetch Documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents', employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/documents/employee/${employeeId}`);
      return data;
    },
    enabled: isOpen && !!employeeId,
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!employeeId) {
        throw new Error('Missing employee id');
      }
      const formData = new FormData();
      formData.append('file', file);
      // Let the browser set the multipart boundary; manually setting Content-Type can break uploads.
      const { data } = await api.post(`/admin/documents/${employeeId}`, formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', employeeId] });
      showToast('Document uploaded successfully', 'success');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.details?.[0] ||
        err?.message ||
        'Failed to upload document';
      showToast(message, 'error');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await api.delete(`/admin/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', employeeId] });
      showToast('Document deleted', 'info');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to delete document', 'error')
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (!employeeId) {
        showToast('Cannot upload: missing employee id', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (e.target.files[0].size > maxUploadBytes) {
        showToast('File too large. Max size is 10MB.', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setIsUploading(true);
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await api.get(`/admin/documents/download/${doc.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showToast('Error downloading file', 'error');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Employee Documents
            </h2>
            <p className="text-sm text-slate-500 mt-1">{employeeName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-amber-50 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/20">
          
          {/* Upload Area - Admin/HR */}
          {(role === 'ADMIN' || role === 'HR_MANAGER') && (
            <div className="mb-8">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={isUploading} 
              />
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  isUploading 
                    ? 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/50' 
                    : 'border-indigo-200 bg-indigo-50/50 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  {isUploading ? (
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mb-2"></div>
                  ) : (
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  )}
                  <span className="font-medium">{isUploading ? 'Uploading document...' : 'Click to Upload Document'}</span>
                  <span className="text-xs opacity-70">PNG, JPG, PDF, DOCX up to 10MB</span>
                </div>
              </div>
            </div>
          )}

          {/* Document List */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 tracking-wide uppercase">Uploaded Files</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 text-sm">No documents found for this employee.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        {doc.fileType?.includes('pdf') ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        ) : doc.fileType?.includes('image') ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={doc.fileName}>{doc.fileName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded by {doc.uploadedBy} on {formatDate(doc.uploadedAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                        {(role === 'ADMIN' || (role === 'HR_MANAGER' && doc.uploadedBy === username)) && (
                          <button
                            onClick={() => {
                              if(confirm('Are you sure you want to delete this document?')) {
                                deleteMutation.mutate(doc.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-full transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
