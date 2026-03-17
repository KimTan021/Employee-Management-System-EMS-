import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useRef } from 'react';
import { useModalBehavior } from './shared/useModalBehavior';

interface AuditLog {
  id: number;
  action: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export default function AuditLogModal({ isOpen, onClose, entityId, entityType, entityName }: { isOpen: boolean, onClose: () => void, entityId?: number, entityType: string, entityName: string }) {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalBehavior({ isOpen, onClose, modalRef });

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['auditLogs', entityType, entityId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/audit/${entityType}/${entityId}`);
      return data;
    },
    enabled: isOpen && !!entityId,
  });

  if (!isOpen) return null;

  const renderValueChanges = (oldVal: string, newVal: string, action: string) => {
    if (action === 'DELETE') return <div className="text-red-500 text-xs mt-1">Record deleted</div>;
    if (action === 'CREATE') return <div className="text-green-500 text-xs mt-1">Record created</div>;
    
    try {
        const o = JSON.parse(oldVal || '{}');
        const n = JSON.parse(newVal || '{}');
        const changes = [];
        for (const key in n) {
            if (o[key] !== n[key] && key !== 'updatedAt') {
                changes.push(
                    <div key={key} className="text-xs mt-1 truncate" title={`${o[key]} -> ${n[key]}`}>
                        <span className="font-medium text-slate-500 dark:text-slate-400">{key}:</span> <span className="line-through text-red-500/70">{String(o[key] || 'null')}</span> <span className="text-slate-400 mx-1">&rarr;</span> <span className="text-green-600 dark:text-green-400 font-medium">{String(n[key] || 'null')}</span>
                    </div>
                );
            }
        }
        return changes.length > 0 ? changes : <div className="text-xs mt-1 text-slate-400">No substantial changes</div>;
    } catch(e) {
        return <div className="text-xs mt-1 text-slate-400">Complex modification</div>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200/50 dark:border-slate-700/50">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
          <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">Audit History</h2>
              <p className="text-sm text-slate-500 mt-1">{entityName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-amber-50 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-900/20">
          {isLoading ? (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-slate-500 font-medium">No history found for this record.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
              {logs.map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                        {log.action === 'CREATE' && <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>}
                        {log.action === 'UPDATE' && <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>}
                        {log.action === 'DELETE' && <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>}
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                log.action === 'CREATE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                log.action === 'UPDATE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>{log.action}</span>
                            <span className="text-xs font-medium text-slate-400">{new Date(log.changedAt).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Changed by <span className="font-semibold text-slate-700 dark:text-slate-200">{log.changedBy}</span>
                        </div>
                        <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100/50 dark:border-slate-800/50">
                            {renderValueChanges(log.oldValue, log.newValue, log.action)}
                        </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
