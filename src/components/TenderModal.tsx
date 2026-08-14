import React, { useState, useEffect } from 'react';
import { Tender, SubArea, TenderStatus } from '../types';
import { calculateBidValidity, SUB_AREAS } from '../utils/tenderUtils';
import { X, Calendar, DollarSign, FileText, Sparkles } from 'lucide-react';

interface TenderModalProps {
  isOpen: boolean;
  tenderToEdit: Tender | null;
  onClose: () => void;
  onSave: (tender: Tender) => void;
}

export const TenderModal: React.FC<TenderModalProps> = ({
  isOpen,
  tenderToEdit,
  onClose,
  onSave,
}) => {
  const [description, setDescription] = useState<string>('');
  const [subArea, setSubArea] = useState<SubArea>('Nagpur Area Execution');
  const [value, setValue] = useState<string>('');
  const [pubDate, setPubDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [openDate, setOpenDate] = useState<string>('');
  const [validDate, setValidDate] = useState<string>('');
  const [tcr1, setTcr1] = useState<string>('');
  const [tcr2, setTcr2] = useState<string>('');
  const [appDate, setAppDate] = useState<string>('');
  const [loaDate, setLoaDate] = useState<string>('');
  const [status, setStatus] = useState<TenderStatus>('Published');
  const [remarks, setRemarks] = useState<string>('');

  useEffect(() => {
    if (tenderToEdit) {
      setDescription(tenderToEdit.description || '');
      setSubArea(tenderToEdit.subArea || 'Nagpur Area Execution');
      setValue(tenderToEdit.value ? String(tenderToEdit.value) : '');
      setPubDate(tenderToEdit.pubDate || '');
      setEndDate(tenderToEdit.endDate || '');
      setOpenDate(tenderToEdit.openDate || '');
      setValidDate(tenderToEdit.validDate || '');
      setTcr1(tenderToEdit.tcr1 || '');
      setTcr2(tenderToEdit.tcr2 || '');
      setAppDate(tenderToEdit.appDate || '');
      setLoaDate(tenderToEdit.loaDate || '');
      setStatus(tenderToEdit.status || 'Published');
      setRemarks(tenderToEdit.remarks || '');
    } else {
      // Reset form
      setDescription('');
      setSubArea('Nagpur Area Execution');
      setValue('');
      setPubDate('');
      setEndDate('');
      setOpenDate('');
      setValidDate('');
      setTcr1('');
      setTcr2('');
      setAppDate('');
      setLoaDate('');
      setStatus('Published');
      setRemarks('');
    }
  }, [tenderToEdit, isOpen]);

  // Recalculate +120 days validity automatically whenever endDate changes
  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (val) {
      const computed = calculateBidValidity(val);
      setValidDate(computed);
    } else {
      setValidDate('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !subArea || !value || !endDate) {
      alert('Please fill in all required fields (*)');
      return;
    }

    const numericVal = parseFloat(value);
    if (isNaN(numericVal) || numericVal <= 0) {
      alert('Please enter a valid positive number for Tender Value');
      return;
    }

    const newOrUpdatedTender: Tender = {
      id: tenderToEdit ? tenderToEdit.id : `TND-NAG-${Date.now().toString().slice(-6)}`,
      description,
      subArea,
      value: numericVal,
      pubDate,
      endDate,
      openDate,
      validDate: validDate || calculateBidValidity(endDate),
      tcr1,
      tcr2,
      appDate,
      loaDate,
      status,
      remarks,
      createdAt: tenderToEdit ? tenderToEdit.createdAt : new Date().toISOString(),
    };

    onSave(newOrUpdatedTender);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 relative my-8 border-t-8 border-[#003366]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-gray-200 pb-3">
          <div className="p-2.5 bg-blue-50 text-[#003366] rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {tenderToEdit ? 'Edit Tender Record' : 'Add New Civil Tender Record'}
            </h2>
            <p className="text-xs text-gray-500">
              Enter complete details for WCL Nagpur Area Civil Division
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Work Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Work Description *
              </label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed scope of work..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* Sub-Area */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Sub-Area *
              </label>
              <select
                required
                value={subArea}
                onChange={(e) => setSubArea(e.target.value as SubArea)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#003366] bg-white"
              >
                {SUB_AREAS.map((sa) => (
                  <option key={sa} value={sa}>
                    {sa}
                  </option>
                ))}
              </select>
            </div>

            {/* Value in INR */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Value of Tender (₹) *
              </label>
              <input
                type="number"
                step="1"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 3450000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* Published Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Published Date
              </label>
              <input
                type="date"
                value={pubDate}
                onChange={(e) => setPubDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* Bid Submission End Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Bid Submission End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* Bid Opening Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Bid Opening Date
              </label>
              <input
                type="date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* Bid Validity (Auto +120 Days) */}
            <div>
              <label className="block text-xs font-bold text-[#003366] mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bid Validity (Auto +120 Days)</span>
              </label>
              <input
                type="date"
                readOnly
                value={validDate}
                className="w-full px-3 py-2 border border-blue-200 rounded-md text-xs font-bold text-[#003366] bg-blue-50/60 cursor-not-allowed"
              />
            </div>

            {/* TCR 1 Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Part-1 TCR Date
              </label>
              <input
                type="date"
                value={tcr1}
                onChange={(e) => setTcr1(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* TCR 2 Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Part-2 TCR Date
              </label>
              <input
                type="date"
                value={tcr2}
                onChange={(e) => setTcr2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* Approval Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Approval of TCR Date
              </label>
              <input
                type="date"
                value={appDate}
                onChange={(e) => setAppDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* LOA Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                LOA Date
              </label>
              <input
                type="date"
                value={loaDate}
                onChange={(e) => setLoaDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TenderStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#003366] bg-white"
              >
                <option value="Published">Published</option>
                <option value="Technical Evaluation">Technical Evaluation</option>
                <option value="Financial Evaluation">Financial Evaluation</option>
                <option value="TCR Process">TCR Process</option>
                <option value="LOA Issued">LOA Issued</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes or status details"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-md text-xs font-bold shadow-sm cursor-pointer"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
