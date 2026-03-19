import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { BaseModal } from './ui/BaseModal';
import { ENDPOINTS } from '../constants/api';
import { MESSAGES } from '../constants/messages';

interface AuditLog {
  id: number;
  action: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export default function AuditLogModal({ isOpen, onClose, entityId, entityType, entityName }: { isOpen: boolean, onClose: () => void, entityId?: number, entityType: string, entityName: string }) {
  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['auditLogs', entityType, entityId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.AUDIT.ENTITY(entityType, entityId!));
      return data;
    },
    enabled: isOpen && !!entityId,
  });

  const renderValueChanges = (oldVal: string, newVal: string, action: string) => {
    if (action === 'DELETE') return <div className="text-rose-500 text-xs font-bold uppercase tracking-widest mt-1">{MESSAGES.UI.AUDIT_LOG.RECORD_PURGED}</div>;
    if (action === 'CREATE') return <div className="text-emerald-500 text-xs font-bold uppercase tracking-widest mt-1">{MESSAGES.UI.AUDIT_LOG.RECORD_BORN}</div>;
    
    try {
        const o = JSON.parse(oldVal || '{}');
        const n = JSON.parse(newVal || '{}');
        const changes = [];
        for (const key in n) {
            if (o[key] !== n[key] && key !== 'updatedAt') {
                changes.push(
                    <div key={key} className="flex flex-col gap-1 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key}</span>
                        <div className="flex items-center gap-2 text-xs">
                           <span className="line-through text-rose-500/70 opacity-60 truncate max-w-[100px]">{String(o[key] || MESSAGES.UI.AUDIT_LOG.EMPTY)}</span>
                           <span className="text-slate-300">&rarr;</span>
                           <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate">{String(n[key] || MESSAGES.UI.AUDIT_LOG.NULL)}</span>
                        </div>
                      </div>
                );
            }
        }
        return changes.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 mt-2">{changes}</div>
        ) : (
          <div className="text-xs mt-1 text-slate-400 italic">{MESSAGES.UI.AUDIT_LOG.NO_UPDATES}</div>
        );
    } catch(e) {
        return <div className="text-xs mt-1 text-slate-400">{MESSAGES.UI.AUDIT_LOG.METADATA_UPDATED}</div>;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={MESSAGES.UI.AUDIT_LOG.TITLE}
      maxWidth="lg"
      isLoading={isLoading}
      footer={
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-bold transition-all"
          >
            {MESSAGES.UI.COMMON.CLOSE}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{entityName}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{MESSAGES.UI.AUDIT_LOG.LIFECYCLE_TRACKING}</p>
          </div>
        </div>

        {!logs || logs.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-slate-100 dark:border-slate-800">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{MESSAGES.UI.AUDIT_LOG.NO_AUDIT_TRAILS}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                <div className={`absolute left-[-5px] top-1 w-[11px] h-[11px] rounded-full ring-4 ring-white dark:ring-slate-900 ${
                  log.action === 'CREATE' ? 'bg-emerald-500' :
                  log.action === 'UPDATE' ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}></div>
                
                <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 transition-all hover:border-slate-200 dark:hover:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                          log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          log.action === 'UPDATE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                       }`}>{log.action}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(log.changedAt).toLocaleDateString()} at {new Date(log.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                       {log.changedBy?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                       Modified by {log.changedBy}
                    </span>
                  </div>

                  <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50">
                    {renderValueChanges(log.oldValue, log.newValue, log.action)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
