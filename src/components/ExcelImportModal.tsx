import React, { useState, useRef, useMemo } from 'react';
import { Tender, User } from '../types';
import { parseExcelOrCSV, downloadSampleExcelTemplate, ParseResult, normalizeTenderDescription } from '../utils/excelParser';
import { formatINR, isUrgentValidity, getDaysUntilValidity } from '../utils/tenderUtils';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Layers, 
  RefreshCw, 
  Info,
  Check,
  PlusCircle,
  RotateCw
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  currentUser: User | null;
  existingTenders?: Tender[];
  onClose: () => void;
  onImportSuccess: (importedTenders: Tender[], mode: 'merge' | 'replace') => Promise<void>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  currentUser,
  existingTenders = [],
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parsing, setParsing] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze how many rows will be newly added vs how many will update existing records based on Work Description
  const mergeStats = useMemo(() => {
    if (!parseResult || parseResult.tenders.length === 0) {
      return { willUpdateCount: 0, willAddCount: 0 };
    }
    const existingDescSet = new Set(
      existingTenders.map((t) => normalizeTenderDescription(t.description)).filter(Boolean)
    );

    let willUpdateCount = 0;
    let willAddCount = 0;

    parseResult.tenders.forEach((item) => {
      const norm = normalizeTenderDescription(item.description);
      if (norm && existingDescSet.has(norm)) {
        willUpdateCount++;
      } else {
        willAddCount++;
      }
    });

    return { willUpdateCount, willAddCount };
  }, [parseResult, existingTenders]);

  if (!isOpen || currentUser?.role !== 'Tender Cell') return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    setErrorMsg(null);
    setFile(selectedFile);
    setParsing(true);

    try {
      const result = await parseExcelOrCSV(selectedFile);
      setParseResult(result);
      if (result.validRows === 0) {
        setErrorMsg('No valid tender rows found in this file. Please ensure columns include Work Description, Sub-Area, Value, Bid Dates, etc.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error parsing file. Please verify it is a valid Excel (.xlsx/.xls) or CSV file.');
      setParseResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.tenders.length === 0) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      await onImportSuccess(parseResult.tenders, importMode);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete import.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setErrorMsg(null);
    setImportMode('merge');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 relative border-t-8 border-[#003366] my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Upload / Import Excel & CSV Data
            </h2>
            <p className="text-xs text-gray-500">
              Auto-merges new tenders into the portal. Existing tenders are updated only when the Work Description matches.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Instructions & Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#003366] shrink-0" />
              <span>
                Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> files with auto-merge, description deduplication, and +120-day validity.
              </span>
            </div>
            <button
              onClick={downloadSampleExcelTemplate}
              className="inline-flex items-center gap-1 bg-white hover:bg-blue-100 text-[#003366] px-3 py-1 rounded border border-blue-300 font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-600 bg-blue-50/60 scale-[1.01]'
                : file
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-gray-300 hover:border-blue-500 bg-gray-50/60 hover:bg-gray-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className={`p-3 rounded-full ${file ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-[#003366]'}`}>
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold text-gray-800">
                {file ? file.name : 'Click to select or drag & drop your Excel/CSV file here'}
              </div>
              <p className="text-xs text-gray-500">
                {file 
                  ? `${(file.size / 1024).toFixed(1)} KB — Ready to parse & sync` 
                  : 'Supported formats: .xlsx, .xls, .csv (from your computer or exported backup)'}
              </p>
            </div>
          </div>

          {/* Loading status */}
          {parsing && (
            <div className="flex items-center justify-center gap-2 p-4 text-xs font-bold text-[#003366]">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing spreadsheet columns and computing validity dates...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parse Result Summary & Options */}
          {parseResult && parseResult.validRows > 0 && (
            <div className="space-y-4">
              {/* Summary Stats Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>{parseResult.validRows} Total Tenders in File</span>
                  </span>

                  {importMode === 'merge' && (
                    <>
                      {mergeStats.willAddCount > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200">
                          <PlusCircle className="w-3.5 h-3.5 text-blue-700" />
                          <span>{mergeStats.willAddCount} New (Will Merge)</span>
                        </span>
                      )}
                      {mergeStats.willUpdateCount > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                          <RotateCw className="w-3.5 h-3.5 text-amber-700" />
                          <span>{mergeStats.willUpdateCount} Existing (Will Overwrite/Update)</span>
                        </span>
                      )}
                    </>
                  )}

                  {parseResult.errors.length > 0 && (
                    <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {parseResult.errors.length} rows skipped (missing description)
                    </span>
                  )}
                </div>

                {/* Import Mode Radio Switch */}
                <div className="flex items-center gap-4 font-bold text-gray-800">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-[#003366] focus:ring-[#003366]"
                    />
                    <span className="text-[#003366]">Auto-Merge (Recommended)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-gray-500 hover:text-red-700">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-red-600 focus:ring-red-600"
                    />
                    <span>Replace All</span>
                  </label>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 flex justify-between items-center">
                  <span>Data Preview (Showing first {Math.min(6, parseResult.tenders.length)} of {parseResult.tenders.length} records)</span>
                  <span className="text-[11px] text-gray-500 font-normal">
                    {importMode === 'merge' ? 'Matching descriptions will update existing; new descriptions will be added' : 'All existing records will be replaced'}
                  </span>
                </div>
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#003366] text-white font-bold text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Import Action</th>
                        <th className="p-2 min-w-[200px]">Work Description</th>
                        <th className="p-2">Sub-Area</th>
                        <th className="p-2 text-right">Value (₹)</th>
                        <th className="p-2">Bid End Date</th>
                        <th className="p-2 text-amber-300">Validity (+120d)</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parseResult.tenders.slice(0, 6).map((t, idx) => {
                        const urgent = isUrgentValidity(t);
                        const daysLeft = getDaysUntilValidity(t.validDate);
                        const norm = normalizeTenderDescription(t.description);
                        const isExistingMatch = existingTenders.some(
                          (ex) => normalizeTenderDescription(ex.description) === norm
                        );

                        return (
                          <tr key={idx} className={`hover:bg-gray-50 ${urgent ? 'bg-amber-50/60' : ''}`}>
                            <td className="p-2 whitespace-nowrap">
                              {importMode === 'replace' ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                                  Replace
                                </span>
                              ) : isExistingMatch ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-300 flex items-center gap-1 w-fit">
                                  <RotateCw className="w-2.5 h-2.5 text-amber-700" />
                                  <span>Update Existing</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300 flex items-center gap-1 w-fit">
                                  <PlusCircle className="w-2.5 h-2.5 text-emerald-700" />
                                  <span>Add New</span>
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-medium text-gray-900 truncate max-w-xs">{t.description}</td>
                            <td className="p-2 font-bold text-gray-800">{t.subArea}</td>
                            <td className="p-2 text-right font-bold text-gray-900">{formatINR(t.value)}</td>
                            <td className="p-2 text-gray-600 whitespace-nowrap">{t.endDate || '-'}</td>
                            <td className="p-2 whitespace-nowrap">
                              <span className="font-bold text-[#003366]">{t.validDate || '-'}</span>
                              {urgent && daysLeft !== null && (
                                <span className="ml-1.5 text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded">
                                  {daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-center flex-wrap gap-2 shrink-0">
          <div className="text-[11px] text-gray-500">
            {currentUser && (
              <span>Acting as: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parseResult || parseResult.validRows === 0 || uploading}
              onClick={handleConfirmImport}
              className={`px-5 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer ${
                !parseResult || parseResult.validRows === 0 || uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#003366] hover:bg-[#002244]'
              }`}
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing to Server...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Upload &amp; Sync {parseResult?.validRows ? `(${parseResult.validRows} Tenders)` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
