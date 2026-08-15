import React, { useRef } from 'react';
import { AuditLog, Tender } from '../types';
import { ShieldAlert, Trash2, Clock, UserCheck, Download, Upload, Database } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
  tenders: Tender[];
  onClearLogs: () => void;
  onRestoreBackup: (restoredTenders: Tender[]) => void;
  isAdmin: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  tenders,
  onClearLogs,
  onRestoreBackup,
  isAdmin,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tenders, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wcl-nagpur-tenders-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onRestoreBackup(parsed);
        } else {
          alert('Invalid backup file. Array of tenders expected.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Database Backup & Transfer Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-[#003366] rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#003366]">
              Database Backup & Multi-Device Transfer
            </h3>
            <p className="text-xs text-gray-500">
              Total active records: <strong className="text-gray-900">{tenders.length} tenders</strong>. Download a backup file or transfer between systems.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-300"
          >
            <Download className="w-3.5 h-3.5 text-[#003366]" />
            <span>Download Backup (.json)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore / Upload Backup</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#003366] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            <span>System Activity Audit Logs</span>
          </h2>
          <p className="text-xs text-gray-500">
            Immutable operation history of user logins, data modifications, and governance events
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onClearLogs}
            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            No activity logs available.
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#003366] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                      {log.action}
                    </span>
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                      {log.user} ({log.role})
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs font-medium pl-0.5">{log.details}</p>
                </div>

                <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 shrink-0 self-start sm:self-auto">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
