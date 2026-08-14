import React, { useState } from 'react';
import { Tender, User, SubArea } from '../types';
import { 
  isUrgentValidity, 
  getDaysUntilValidity, 
  formatINR, 
  exportToCSV, 
  SUB_AREAS 
} from '../utils/tenderUtils';
import { 
  Search, 
  Plus, 
  Download, 
  Printer, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileSpreadsheet,
  UploadCloud
} from 'lucide-react';

interface TenderListProps {
  tenders: Tender[];
  currentUser: User;
  viewCategory: 'below' | 'above' | 'urgent' | 'all';
  initialSubAreaFilter?: SubArea | 'ALL';
  onOpenAddModal: () => void;
  onOpenEditModal: (tender: Tender) => void;
  onDeleteTender: (id: string) => void;
  onOpenImportModal?: () => void;
}

export const TenderList: React.FC<TenderListProps> = ({
  tenders,
  currentUser,
  viewCategory,
  initialSubAreaFilter = 'ALL',
  onOpenAddModal,
  onOpenEditModal,
  onDeleteTender,
  onOpenImportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubArea, setSelectedSubArea] = useState<SubArea | 'ALL'>(initialSubAreaFilter);
  const [onlyUrgent, setOnlyUrgent] = useState<boolean>(viewCategory === 'urgent');

  // Filter tenders according to user context, view category, sub area, urgent state, and search term
  const filteredTenders = tenders.filter((t) => {
    // 1. Role constraint (SAE only sees their sub area)
    if (currentUser.role === 'SAE' && currentUser.subArea) {
      if (t.subArea !== currentUser.subArea) return false;
    } else if (selectedSubArea !== 'ALL') {
      if (t.subArea !== selectedSubArea) return false;
    }

    // 2. View category constraint
    if (viewCategory === 'below' && t.value >= 5000000) return false;
    if (viewCategory === 'above' && t.value < 5000000) return false;
    if (viewCategory === 'urgent' || onlyUrgent) {
      if (!isUrgentValidity(t)) return false;
    }

    // 3. Search term constraint
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const descMatch = (t.description || '').toLowerCase().includes(q);
      const subAreaMatch = (t.subArea || '').toLowerCase().includes(q);
      const idMatch = (t.id || '').toLowerCase().includes(q);
      const statusMatch = (t.status || '').toLowerCase().includes(q);
      const remarksMatch = (t.remarks || '').toLowerCase().includes(q);
      if (!descMatch && !subAreaMatch && !idMatch && !statusMatch && !remarksMatch) {
        return false;
      }
    }

    return true;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'LOA Issued':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'TCR Process':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTitle = () => {
    if (viewCategory === 'urgent' || onlyUrgent) {
      return 'Urgent Tenders — Bid Validity Expiring in \u2264 20 Days';
    }
    if (viewCategory === 'below') return 'Tender Records Below ₹50 Lakhs';
    if (viewCategory === 'above') return 'Tender Records \u2265 ₹50 Lakhs';
    return 'All Civil Tender Records';
  };

  return (
    <div className="space-y-4">
      {/* Table Controls Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#003366] flex items-center gap-2">
            <span>{getTitle()}</span>
            <span className="bg-blue-50 text-[#003366] text-xs px-2.5 py-0.5 rounded-full border border-blue-200 font-bold">
              {filteredTenders.length} Record{filteredTenders.length !== 1 ? 's' : ''}
            </span>
          </h2>
          <p className="text-xs text-gray-500">
            {currentUser.role === 'Staff Officer'
              ? 'Staff Officer (Civil) View — Full monitoring across all sub-areas'
              : currentUser.role === 'SAE'
              ? `Sub-Area Engineer View — Filtered for ${currentUser.subArea}`
              : 'Interactive Tender Registry'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Sub Area Filter (hidden if SAE since SAE is fixed) */}
          {currentUser.role !== 'SAE' && (
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedSubArea}
                onChange={(e) => setSelectedSubArea(e.target.value as SubArea | 'ALL')}
                className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Sub-Areas</option>
                {SUB_AREAS.map((sa) => (
                  <option key={sa} value={sa}>
                    {sa}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Urgent Filter Toggle */}
          <button
            onClick={() => setOnlyUrgent(!onlyUrgent)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              onlyUrgent
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>&le; 20 Days Validity Only</span>
          </button>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search description, sub-area..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#003366] bg-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Actions */}
          {currentUser.role === 'Tender Cell' && (
            <button
              onClick={onOpenAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Tender</span>
            </button>
          )}

          {onOpenImportModal && (currentUser.role === 'Tender Cell' || currentUser.role === 'Admin' || currentUser.role === 'Staff Officer') && (
            <button
              onClick={onOpenImportModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer shrink-0"
              title="Upload and import Excel / CSV spreadsheet data"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>
          )}

          <button
            onClick={() => exportToCSV(filteredTenders, `WCL_Tenders_${viewCategory}`)}
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer shrink-0"
            title="Export data to CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer shrink-0"
            title="Print printable report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#003366] text-white sticky top-0 z-10 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 w-12 text-center">S.No</th>
                <th className="p-3 min-w-[240px]">Work Description</th>
                <th className="p-3 min-w-[130px]">Sub-Area</th>
                <th className="p-3 min-w-[120px] text-right">Value (₹)</th>
                <th className="p-3 min-w-[100px]">Published</th>
                <th className="p-3 min-w-[110px]">Bid End Date</th>
                <th className="p-3 min-w-[130px] bg-blue-900/90 text-amber-300">
                  Bid Validity (+120 Days)
                </th>
                <th className="p-3 min-w-[90px]">Part-1 TCR</th>
                <th className="p-3 min-w-[90px]">Part-2 TCR</th>
                <th className="p-3 min-w-[90px]">Approval</th>
                <th className="p-3 min-w-[90px]">LOA Date</th>
                <th className="p-3 min-w-[120px]">Status</th>
                {currentUser.role === 'Tender Cell' && (
                  <th className="p-3 w-20 text-center no-print">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTenders.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="p-12 text-center text-gray-500 font-medium bg-gray-50/50"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileSpreadsheet className="w-10 h-10 text-gray-300 stroke-1" />
                      <p className="text-sm font-bold text-gray-700">No tender records found</p>
                      <p className="text-xs text-gray-400 max-w-md">
                        {currentUser.role === 'Tender Cell' || currentUser.role === 'Admin' || currentUser.role === 'Staff Officer'
                          ? 'Get started by clicking "+ Add Tender" or "Import Excel" to upload your tender data.'
                          : 'No tenders have been published or assigned for this category yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenders.map((t, idx) => {
                  const urgent = isUrgentValidity(t);
                  const daysLeft = getDaysUntilValidity(t.validDate);
                  const isNagpurExec = t.subArea === 'Nagpur Area Execution';

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        urgent
                          ? 'bg-amber-50/90 hover:bg-amber-100/90 border-l-4 border-l-amber-500'
                          : isNagpurExec
                          ? 'bg-blue-50/40 hover:bg-blue-50/80'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* S.No */}
                      <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>

                      {/* Description */}
                      <td className="p-3">
                        <div className="font-bold text-gray-900 leading-snug">{t.description}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>Ref: {t.id}</span>
                          {t.remarks && <span className="italic text-gray-600">({t.remarks})</span>}
                        </div>
                      </td>

                      {/* Sub Area */}
                      <td className="p-3 font-semibold text-gray-800">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            isNagpurExec
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {t.subArea}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="p-3 text-right font-black text-gray-900">
                        {formatINR(t.value)}
                      </td>

                      {/* Published Date */}
                      <td className="p-3 text-gray-600 whitespace-nowrap">{t.pubDate || '-'}</td>

                      {/* Bid End Date */}
                      <td className="p-3 text-gray-700 whitespace-nowrap font-medium">
                        {t.endDate || '-'}
                      </td>

                      {/* Bid Validity (+120 Days) Column with URGENT Highlighting */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-[#003366]">{t.validDate || '-'}</div>
                        {urgent && daysLeft !== null && (
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border shadow-2xs ${
                                daysLeft <= 5
                                  ? 'bg-red-600 text-white border-red-700 animate-pulse'
                                  : 'bg-amber-500 text-white border-amber-600'
                              }`}
                              title="URGENT: Bid validity expiring in next 20 days! Fast-track TCR / LOA documentation."
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>
                                {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} DAYS LEFT`}
                              </span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* TCR 1 */}
                      <td className="p-3 text-gray-600 whitespace-nowrap">{t.tcr1 || '-'}</td>

                      {/* TCR 2 */}
                      <td className="p-3 text-gray-600 whitespace-nowrap">{t.tcr2 || '-'}</td>

                      {/* Approval */}
                      <td className="p-3 text-gray-600 whitespace-nowrap">{t.appDate || '-'}</td>

                      {/* LOA Date */}
                      <td className="p-3 text-gray-600 whitespace-nowrap">{t.loaDate || '-'}</td>

                      {/* Status */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-extrabold uppercase ${getStatusBadgeClass(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Actions */}
                      {currentUser.role === 'Tender Cell' && (
                        <td className="p-3 text-center whitespace-nowrap no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenEditModal(t)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Edit Tender Record"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteTender(t.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
