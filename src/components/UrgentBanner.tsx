import React from 'react';
import { Tender, User } from '../types';
import { isUrgentValidity, getDaysUntilValidity, formatINR } from '../utils/tenderUtils';
import { AlertTriangle, ArrowRight, Clock, ShieldAlert } from 'lucide-react';

interface UrgentBannerProps {
  tenders: Tender[];
  currentUser: User | null;
  onViewUrgent: () => void;
}

export const UrgentBanner: React.FC<UrgentBannerProps> = ({
  tenders,
  currentUser,
  onViewUrgent,
}) => {
  // Filter tenders based on user role context
  const relevantTenders = tenders.filter((t) => {
    if (!currentUser) return true;
    if (currentUser.role === 'SAE' && currentUser.subArea) {
      return t.subArea === currentUser.subArea;
    }
    return true; // Staff Officer, Tender Cell, Admin see all
  });

  const urgentTenders = relevantTenders.filter(isUrgentValidity);

  if (urgentTenders.length === 0) {
    return null;
  }

  // Group count by sub-area
  const subAreaCounts: Record<string, number> = {};
  urgentTenders.forEach((t) => {
    subAreaCounts[t.subArea] = (subAreaCounts[t.subArea] || 0) + 1;
  });

  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 md:p-5 shadow-sm mb-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-amber-900 text-base">
                URGENT ATTENTION REQUIRED: Bid Validity Expiring Within 20 Days
              </h3>
              <span className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {urgentTenders.length} Tender{urgentTenders.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
              {currentUser?.role === 'Staff Officer'
                ? 'Staff Officer (Civil) Priority Alert: The following tenders have their Bid Validity (+120 days) expiring in less than 20 days. Fast-track TCR approval or LOA issuance to avoid tender lapses.'
                : currentUser?.role === 'SAE'
                ? `Sub-Area Engineer (${currentUser.subArea}) Action Required: ${urgentTenders.length} tender(s) in your sub-area require urgent documentation processing.`
                : 'Priority alert for tenders with upcoming bid validity expiration within 20 days.'}
            </p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {Object.entries(subAreaCounts).map(([sa, cnt]) => (
                <span
                  key={sa}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                    sa === 'Nagpur Area Execution'
                      ? 'bg-blue-100 border-blue-300 text-blue-900'
                      : 'bg-white/80 border-amber-300 text-amber-900'
                  }`}
                >
                  {sa}: <strong>{cnt}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onViewUrgent}
          className="self-stretch md:self-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors shrink-0 cursor-pointer"
        >
          <span>Track Urgent Tenders</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick top 2 list preview */}
      <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {urgentTenders.slice(0, 2).map((t) => {
          const daysLeft = getDaysUntilValidity(t.validDate);
          return (
            <div
              key={t.id}
              className="bg-white/90 border border-amber-300 rounded-md p-2.5 flex items-center justify-between gap-2"
            >
              <div className="truncate">
                <span className="font-bold text-gray-900 block truncate">{t.description}</span>
                <span className="text-[11px] text-gray-600">
                  Sub-Area: <strong>{t.subArea}</strong> | Value: {formatINR(t.value)}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[11px]">
                  <Clock className="w-3 h-3 text-red-600" />
                  {daysLeft !== null && daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} Days Left`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
