import React from 'react';
import { UserCheck, HardHat, FileText, ShieldCheck, ArrowRight, Building2, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (roleType: 'staffofficer' | 'sae' | 'tendercell' | 'admin', roleLabel: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-[#003366] text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" />
          <span>WCL Nagpur Area Civil Division</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Tender Monitoring & Tracking Portal
        </h2>
        <p className="text-xs md:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Select your official designation or department to log in and access real-time civil tender status, auto-calculated 120-day bid validities, and urgent 20-day expiration tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Staff Officer (Civil) */}
        <div
          onClick={() => onOpenAuth('staffofficer', 'Staff Officer (Civil)')}
          className="bg-white p-6 rounded-xl border border-gray-200 border-t-4 border-t-[#003366] shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center hover:-translate-y-1"
        >
          <div className="p-4 bg-blue-50 text-[#003366] rounded-full mb-4 group-hover:scale-110 transition-transform">
            <UserCheck className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#003366] transition-colors">
            Staff Officer (Civil)
          </h3>
          <span className="mt-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Area Office Review
          </span>
          <p className="text-xs text-gray-600 mt-2 flex-1">
            View-only executive oversight across all 6 sub-areas with urgent validity alerts.
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100 w-full flex items-center justify-center gap-1 text-xs font-bold text-[#003366]">
            <span>Access Portal</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Sub-Area Engineer */}
        <div
          onClick={() => onOpenAuth('sae', 'Sub-Area Engineer')}
          className="bg-white p-6 rounded-xl border border-gray-200 border-t-4 border-t-blue-600 shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center hover:-translate-y-1 relative"
        >
          <span className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
            Includes Nagpur Area Execution
          </span>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <HardHat className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900 group-hover:text-blue-600 transition-colors">
            Sub-Area Engineer
          </h3>
          <span className="mt-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Sub-Area Execution
          </span>
          <p className="text-xs text-gray-600 mt-2 flex-1">
            Area-specific tracking for Nagpur Area Execution, Saoner, Silewara, etc.
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100 w-full flex items-center justify-center gap-1 text-xs font-bold text-blue-600">
            <span>Access Portal</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tender Cell */}
        <div
          onClick={() => onOpenAuth('tendercell', 'Tender Cell')}
          className="bg-white p-6 rounded-xl border border-gray-200 border-t-4 border-t-emerald-600 shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center hover:-translate-y-1"
        >
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900 group-hover:text-emerald-600 transition-colors">
            Tender Cell
          </h3>
          <span className="mt-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Data Management
          </span>
          <p className="text-xs text-gray-600 mt-2 flex-1">
            Full permissions to add new tenders, update TCR dates, status, and remarks.
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100 w-full flex items-center justify-center gap-1 text-xs font-bold text-emerald-600">
            <span>Access Portal</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Admin / Audit */}
        <div
          onClick={() => onOpenAuth('admin', 'Admin / Audit')}
          className="bg-white p-6 rounded-xl border border-gray-200 border-t-4 border-t-purple-600 shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center hover:-translate-y-1"
        >
          <div className="p-4 bg-purple-50 text-purple-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900 group-hover:text-purple-600 transition-colors">
            Admin / Audit
          </h3>
          <span className="mt-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            System Governance
          </span>
          <p className="text-xs text-gray-600 mt-2 flex-1">
            System activity auditing, data compliance tracking, and administrative logs.
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100 w-full flex items-center justify-center gap-1 text-xs font-bold text-purple-600">
            <span>Access Portal</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-5 text-center text-xs text-blue-900">
        <span className="font-bold block mb-1">Key Operational Features Included:</span>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-medium text-gray-700">
          <li>✔ New Sub Area Execution: <strong>Nagpur Area Execution</strong></li>
          <li>✔ Auto Bid Validity (+120 Days calculation from Bid Submission End)</li>
          <li>⚡ Priority Highlighting for Bid Validities expiring within <strong>20 Days</strong></li>
          <li>✔ Role-based visibility for Staff Officer &amp; SAEs</li>
          <li>✔ Export to CSV &amp; Printable PDF Reports</li>
        </ul>
      </div>
    </div>
  );
};
