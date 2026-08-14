import React from 'react';
import { User, Tender } from '../types';
import { isUrgentValidity } from '../utils/tenderUtils';
import { LayoutDashboard, FileText, AlertCircle, ShieldAlert, LogOut } from 'lucide-react';

export type TabType = 'dash' | 'below' | 'above' | 'urgent' | 'audit';

interface NavigationProps {
  currentUser: User;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: () => void;
  tenders: Tender[];
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  tenders,
}) => {
  // Count urgent tenders for current user view
  const userTenders = tenders.filter(t => {
    if (currentUser.role === 'SAE' && currentUser.subArea) {
      return t.subArea === currentUser.subArea;
    }
    return true;
  });

  const urgentCount = userTenders.filter(isUrgentValidity).length;

  return (
    <nav className="bg-[#1a1a1a] px-4 md:px-8 flex flex-wrap items-center justify-between min-h-[50px] shadow-md border-b border-gray-800">
      <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('dash')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-3 ${
            activeTab === 'dash'
              ? 'text-white border-[#ed1c24] bg-white/10'
              : 'text-gray-300 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('below')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-3 ${
            activeTab === 'below'
              ? 'text-white border-[#ed1c24] bg-white/10'
              : 'text-gray-300 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Tenders &lt; ₹50 Lakhs</span>
        </button>

        <button
          onClick={() => setActiveTab('above')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-3 ${
            activeTab === 'above'
              ? 'text-white border-[#ed1c24] bg-white/10'
              : 'text-gray-300 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Tenders &ge; ₹50 Lakhs</span>
        </button>

        <button
          onClick={() => setActiveTab('urgent')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-3 relative ${
            activeTab === 'urgent'
              ? 'text-amber-300 border-amber-500 bg-amber-500/20'
              : 'text-amber-200 border-transparent hover:text-amber-100 hover:bg-white/5'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Urgent Validities (&le; 20 Days)</span>
          {urgentCount > 0 && (
            <span className="ml-1 bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {urgentCount}
            </span>
          )}
        </button>

        {(currentUser.role === 'Admin' || currentUser.role === 'Tender Cell') && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-3 ${
              activeTab === 'audit'
                ? 'text-white border-[#ed1c24] bg-white/10'
                : 'text-gray-300 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>System Audit</span>
          </button>
        )}
      </div>

      <button
        onClick={onLogout}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors my-1 ml-auto"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Logout / Exit</span>
      </button>
    </nav>
  );
};
