import React, { useState, useEffect } from 'react';
import { User, Tender } from '../types';
import { isUrgentValidity } from '../utils/tenderUtils';
import { Clock, User as UserIcon, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  tenders: Tender[];
  onOpenUrgentTab: () => void;
  onOpenImportModal?: () => void;
  onRefreshData?: () => void;
  isSyncing?: boolean;
  lastSyncedTime?: Date | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  tenders, 
  onOpenUrgentTab, 
  onOpenImportModal,
  onRefreshData,
  isSyncing,
  lastSyncedTime
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      setTimeStr(new Date().toLocaleTimeString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute urgent tender count for current user context
  const relevantTenders = tenders.filter(t => {
    if (!currentUser) return false;
    if (currentUser.role === 'SAE' && currentUser.subArea) {
      return t.subArea === currentUser.subArea;
    }
    return true; // Staff Officer, Tender Cell, Admin see all
  });

  const urgentCount = relevantTenders.filter(isUrgentValidity).length;

  return (
    <header className="bg-white border-b-4 border-[#003366] px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between shadow-sm sticky top-0 z-40 gap-3">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base md:text-xl font-extrabold text-[#003366] uppercase tracking-wide leading-tight">
            Western Coalfields Limited
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] text-gray-600 font-bold uppercase tracking-wider">
              Nagpur Area Civil Division | Tender Portal
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Sync / Refresh Button */}
        {currentUser && onRefreshData && (
          <button
            onClick={onRefreshData}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 transition-colors cursor-pointer"
            title="Refresh & fetch latest live updates from other systems"
          >
            <span className={`w-3.5 h-3.5 inline-block ${isSyncing ? 'animate-spin' : ''}`}>🔄</span>
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        )}

        {/* Excel Import Button in Header (Tender Cell ONLY) */}
        {currentUser && onOpenImportModal && currentUser.role === 'Tender Cell' && (
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Upload and import Excel / CSV spreadsheet data (Tender Cell only)"
          >
            <span>📊</span>
            <span>Import Excel</span>
          </button>
        )}

        {currentUser && urgentCount > 0 && (
          <button
            onClick={onOpenUrgentTab}
            className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors px-3 py-1.5 rounded-full text-xs font-bold animate-pulse cursor-pointer shadow-xs"
            title="Click to view tenders with Bid Validity expiring in next 20 days"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{urgentCount} Urgent (&le; 20d)</span>
          </button>
        )}

        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{timeStr || '00:00:00'}</span>
          </div>

          {currentUser ? (
            <div className="mt-1 inline-flex items-center gap-1.5 bg-blue-50 text-[#003366] border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <UserIcon className="w-3 h-3 text-[#003366]" />
              <span>
                {currentUser.role}
                {currentUser.subArea ? ` (${currentUser.subArea})` : ''}
              </span>
            </div>
          ) : (
            <div className="mt-1 inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
              <ShieldCheck className="w-3 h-3 text-gray-400" />
              <span>Guest Mode</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
