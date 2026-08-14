import React from 'react';
import { Tender, User, SubArea } from '../types';
import { isUrgentValidity, formatINR, SUB_AREAS } from '../utils/tenderUtils';
import { UrgentBanner } from './UrgentBanner';
import { 
  Building2, 
  FileCheck, 
  AlertTriangle, 
  Layers, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface DashboardProps {
  tenders: Tender[];
  currentUser: User;
  onNavigate: (tab: 'below' | 'above' | 'urgent') => void;
  onSelectSubAreaFilter?: (subArea: SubArea) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tenders,
  currentUser,
  onNavigate,
  onSelectSubAreaFilter,
}) => {
  // Filter tenders based on role
  const filteredTenders = tenders.filter((t) => {
    if (currentUser.role === 'SAE' && currentUser.subArea) {
      return t.subArea === currentUser.subArea;
    }
    return true;
  });

  const totalCount = filteredTenders.length;
  const below50LCount = filteredTenders.filter((t) => t.value < 5000000).length;
  const above50LCount = filteredTenders.filter((t) => t.value >= 5000000).length;
  const activeCount = filteredTenders.filter(
    (t) => t.status !== 'LOA Issued' && t.status !== 'Cancelled'
  ).length;
  const urgentCount = filteredTenders.filter(isUrgentValidity).length;

  // Compute breakdown by Sub Area
  const subAreaStats = SUB_AREAS.map((sa) => {
    const list = tenders.filter((t) => t.subArea === sa);
    const totalVal = list.reduce((sum, t) => sum + Number(t.value || 0), 0);
    const urgentCnt = list.filter(isUrgentValidity).length;
    return {
      subArea: sa,
      count: list.length,
      totalVal,
      urgentCnt,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner for Urgent Validities */}
      <UrgentBanner
        tenders={tenders}
        currentUser={currentUser}
        onViewUrgent={() => onNavigate('urgent')}
      />

      {/* Role Welcome Greeting */}
      <div className="bg-gradient-to-r from-[#003366] to-[#004080] text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-block bg-white/20 backdrop-blur-xs text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            WCL Nagpur Area Civil Division
          </div>
          <h2 className="text-xl md:text-2xl font-bold">
            Welcome, {currentUser.name}
          </h2>
          <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-2xl">
            {currentUser.role === 'Staff Officer' &&
              'Staff Officer (Civil) Dashboard — Real-time tracking of tenders across all 6 Sub-Areas with urgent 20-day bid validity monitoring.'}
            {currentUser.role === 'SAE' &&
              `Sub-Area Engineer Portal — Dedicated monitoring and tender tracking for ${currentUser.subArea}.`}
            {currentUser.role === 'Tender Cell' &&
              'Tender Cell Master Workspace — Full CRUD access to add, update, and publish civil works tender records.'}
            {currentUser.role === 'Admin' &&
              'System Governance & Audit Portal — Complete operational oversight and audit history.'}
          </p>
        </div>
        <Building2 className="w-48 h-48 absolute -right-6 -bottom-10 text-white/10 pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tenders */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Total Tenders</span>
            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mt-2">{totalCount}</h3>
          <p className="text-[11px] text-gray-500 mt-1">In active database</p>
        </div>

        {/* Below 50L */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-blue-500 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase">&lt; ₹50 Lakhs</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-700 mt-2">{below50LCount}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Minor civil works</p>
        </div>

        {/* Above 50L */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-purple-500 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase">&ge; ₹50 Lakhs</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-700 mt-2">{above50LCount}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Major infrastructure</p>
        </div>

        {/* Active Tenders */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-emerald-500 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Active Processing</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-700 mt-2">{activeCount}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Under evaluation / TCR</p>
        </div>

        {/* Urgent Validities (&le; 20 Days) */}
        <div className={`p-5 rounded-xl border-2 transition-all ${
          urgentCount > 0
            ? 'bg-amber-50 border-amber-400 border-l-6 border-l-amber-600 shadow-md animate-pulse'
            : 'bg-white border-gray-200 border-l-4 border-l-gray-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Validity &le; 20 Days
            </span>
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-900 mt-2">{urgentCount}</h3>
          <p className="text-[11px] text-amber-800 font-bold mt-1">
            {urgentCount > 0 ? 'Requires Urgent Action!' : 'No imminent expiry'}
          </p>
        </div>
      </div>

      {/* Sub-Area Monitoring Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Sub-Area Execution & Monitoring Breakdown
            </h3>
            <p className="text-xs text-gray-500">
              Distribution of tenders across all 6 Nagpur Area Civil Units
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subAreaStats.map((item) => {
            const isNagpurExecution = item.subArea === 'Nagpur Area Execution';
            return (
              <div
                key={item.subArea}
                onClick={() => onSelectSubAreaFilter && onSelectSubAreaFilter(item.subArea)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md relative ${
                  isNagpurExecution
                    ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/50 border-gray-200 hover:border-gray-300'
                }`}
              >
                {isNagpurExecution && (
                  <span className="absolute top-3 right-3 bg-[#003366] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    NEW AREA ADDED
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Building2 className={`w-4 h-4 ${isNagpurExecution ? 'text-[#003366]' : 'text-gray-600'}`} />
                  <h4 className={`font-bold text-sm ${isNagpurExecution ? 'text-[#003366]' : 'text-gray-900'}`}>
                    {item.subArea}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200/80 text-xs">
                  <div>
                    <span className="text-[11px] text-gray-500 block">Total Tenders</span>
                    <span className="font-extrabold text-gray-900 text-sm">{item.count}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 block">Total Value</span>
                    <span className="font-bold text-gray-800 text-xs">{formatINR(item.totalVal)}</span>
                  </div>
                </div>

                {item.urgentCnt > 0 && (
                  <div className="mt-2 text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded font-bold flex items-center justify-between">
                    <span>Urgent Validity (&le; 20 Days):</span>
                    <span className="bg-amber-600 text-white px-1.5 py-0.2 rounded text-[10px] font-black">
                      {item.urgentCnt}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div className="flex flex-wrap gap-4 justify-center pt-2">
        <button
          onClick={() => onNavigate('below')}
          className="bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs px-6 py-3 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span>View Tenders Below ₹50 Lakhs</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onNavigate('above')}
          className="bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs px-6 py-3 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span>View Tenders &ge; ₹50 Lakhs</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onNavigate('urgent')}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>View Urgent Validities (&le; 20 Days)</span>
        </button>
      </div>
    </div>
  );
};
