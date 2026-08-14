import * as XLSX from 'xlsx';
import { Tender, SubArea, TenderStatus } from '../types';
import { calculateBidValidity, SUB_AREAS } from './tenderUtils';

export interface ParseResult {
  tenders: Tender[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

function normalizeSubArea(rawVal: any): SubArea {
  if (!rawVal) return 'Nagpur Area Execution';
  const str = String(rawVal).trim().toLowerCase();

  if (str.includes('nagpur') || str.includes('execution') || str.includes('nae') || str.includes('area office')) {
    return 'Nagpur Area Execution';
  }
  if (str.includes('saoner')) return 'Saoner';
  if (str.includes('silewara') || str.includes('sillewara')) return 'Silewara';
  if (str.includes('bhanegaon') || str.includes('singori')) return 'Bhanegaon Singori';
  if (str.includes('kamptee') || str.includes('kamtee')) return 'Kamptee';
  if (str.includes('gondegaon')) return 'Gondegaon';

  return 'Nagpur Area Execution';
}

function normalizeStatus(rawVal: any): TenderStatus {
  if (!rawVal) return 'Published';
  const str = String(rawVal).trim().toLowerCase();

  if (str.includes('loa') || str.includes('awarded') || str.includes('award') || str.includes('issued')) {
    return 'LOA Issued';
  }
  if (str.includes('cancel') || str.includes('scrapped') || str.includes('reject')) {
    return 'Cancelled';
  }
  if (str.includes('tcr') || str.includes('tender committee')) {
    return 'TCR Process';
  }
  if (str.includes('financial') || str.includes('price bid') || str.includes('l1')) {
    return 'Financial Evaluation';
  }
  if (str.includes('technical') || str.includes('tech eval') || str.includes('part 1') || str.includes('part-1')) {
    return 'Technical Evaluation';
  }

  return 'Published';
}

function parseExcelDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel serial date number
    try {
      const parsedDate = XLSX.SSF.parse_date_code(val);
      if (parsedDate) {
        const y = parsedDate.y;
        const m = String(parsedDate.m).padStart(2, '0');
        const d = String(parsedDate.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // ignore
    }
  }

  const str = String(val).trim();
  if (!str || str === '-' || str.toLowerCase() === 'nil' || str.toLowerCase() === 'na') return '';

  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Fallback try standard Date
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }

  return str;
}

function parseNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export async function parseExcelOrCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert sheet to JSON array of objects
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        if (!rawRows || rawRows.length === 0) {
          return resolve({
            tenders: [],
            errors: ['File is empty or contains no readable table rows.'],
            totalRows: 0,
            validRows: 0,
          });
        }

        const tenders: Tender[] = [];
        const errors: string[] = [];

        rawRows.forEach((row, idx) => {
          // Normalize column keys to lowercase without whitespace/punctuation
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            normalizedRow[cleanKey] = row[key];
          });

          // Extract fields using flexible aliases
          const description = 
            normalizedRow['workdescription'] ||
            normalizedRow['description'] ||
            normalizedRow['nameofwork'] ||
            normalizedRow['workname'] ||
            normalizedRow['tenderdescription'] ||
            normalizedRow['title'] ||
            normalizedRow['work'] ||
            row['Work Description'] ||
            row['Name of Work'] ||
            row['Description'] ||
            '';

          if (!description || String(description).trim().length === 0) {
            errors.push(`Row ${idx + 2}: Skipped because Work Description is missing.`);
            return;
          }

          const rawId = 
            normalizedRow['tenderid'] ||
            normalizedRow['id'] ||
            normalizedRow['refno'] ||
            normalizedRow['referenceno'] ||
            normalizedRow['nitno'] ||
            normalizedRow['sno'] ||
            row['Tender ID'] ||
            row['ID'];

          const id = (rawId && String(rawId).trim() !== '' && !String(rawId).startsWith('__'))
            ? String(rawId).trim()
            : `TND-${Date.now().toString().slice(-6)}-${idx + 1}`;

          const rawSubArea = 
            normalizedRow['subarea'] ||
            normalizedRow['area'] ||
            normalizedRow['division'] ||
            row['Sub-Area'] ||
            row['Area'];

          const subArea = normalizeSubArea(rawSubArea);

          const rawValue = 
            normalizedRow['valueinr'] ||
            normalizedRow['value'] ||
            normalizedRow['estimatedvalue'] ||
            normalizedRow['tendervalue'] ||
            normalizedRow['cost'] ||
            normalizedRow['amount'] ||
            row['Value (INR)'] ||
            row['Value'] ||
            0;

          const value = parseNumber(rawValue);

          const pubDate = parseExcelDate(
            normalizedRow['publisheddate'] ||
            normalizedRow['published'] ||
            normalizedRow['pubdate'] ||
            normalizedRow['nitdate'] ||
            row['Published Date'] ||
            row['Published']
          );

          const endDate = parseExcelDate(
            normalizedRow['bidsubmissionend'] ||
            normalizedRow['bidenddate'] ||
            normalizedRow['enddate'] ||
            normalizedRow['bidend'] ||
            normalizedRow['duedate'] ||
            row['Bid Submission End'] ||
            row['Bid End Date']
          );

          const openDate = parseExcelDate(
            normalizedRow['bidopening'] ||
            normalizedRow['bidopendate'] ||
            normalizedRow['opendate'] ||
            row['Bid Opening'] ||
            row['Bid Open Date']
          );

          let validDate = parseExcelDate(
            normalizedRow['validitydate120days'] ||
            normalizedRow['validitydate'] ||
            normalizedRow['bidvalidity'] ||
            normalizedRow['validdate'] ||
            row['Validity Date (+120 Days)'] ||
            row['Bid Validity']
          );

          // Auto-calculate +120 days validity if validity date is not explicitly provided but endDate is present
          if (!validDate && endDate) {
            validDate = calculateBidValidity(endDate);
          }

          const tcr1 = parseExcelDate(
            normalizedRow['part1tcr'] ||
            normalizedRow['tcr1'] ||
            row['Part-1 TCR'] ||
            row['TCR-1']
          );

          const tcr2 = parseExcelDate(
            normalizedRow['part2tcr'] ||
            normalizedRow['tcr2'] ||
            row['Part-2 TCR'] ||
            row['TCR-2']
          );

          const appDate = parseExcelDate(
            normalizedRow['approvaldate'] ||
            normalizedRow['approval'] ||
            normalizedRow['appdate'] ||
            row['Approval Date'] ||
            row['Approval']
          );

          const loaDate = parseExcelDate(
            normalizedRow['loadate'] ||
            normalizedRow['dateofloa'] ||
            normalizedRow['loa'] ||
            row['LOA Date'] ||
            row['LOA']
          );

          const rawStatus = 
            normalizedRow['status'] ||
            normalizedRow['tenderstatus'] ||
            row['Status'];

          const status = normalizeStatus(rawStatus);

          const remarks = 
            normalizedRow['remarks'] ||
            normalizedRow['remark'] ||
            normalizedRow['notes'] ||
            row['Remarks'] ||
            '';

          tenders.push({
            id,
            description: String(description).trim(),
            subArea,
            value,
            pubDate,
            endDate,
            openDate,
            validDate,
            tcr1,
            tcr2,
            appDate,
            loaDate,
            status,
            remarks: String(remarks).trim(),
            createdAt: new Date().toISOString()
          });
        });

        resolve({
          tenders,
          errors,
          totalRows: rawRows.length,
          validRows: tenders.length
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to parse Excel / CSV file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the selected file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Generates and downloads a clean sample Excel template for users to populate
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'Tender ID': 'TND-NAG-2026-101',
      'Work Description': 'Renovation of Office Complex and Drainage Works at Nagpur Area Execution',
      'Sub-Area': 'Nagpur Area Execution',
      'Value (INR)': 3500000,
      'Published Date': '2026-06-01',
      'Bid Submission End': '2026-06-25',
      'Bid Opening': '2026-06-26',
      'Validity Date (+120 Days)': '2026-10-23',
      'Part-1 TCR': '2026-07-15',
      'Part-2 TCR': '2026-08-01',
      'Approval Date': '',
      'LOA Date': '',
      'Status': 'TCR Process',
      'Remarks': 'Part-2 TCR approved by SO Civil, LOA under draft'
    },
    {
      'Tender ID': 'TND-SAO-2026-102',
      'Work Description': 'Construction of Retaining Wall and Haul Road Culvert at Saoner Mine',
      'Sub-Area': 'Saoner',
      'Value (INR)': 7800000,
      'Published Date': '2026-05-10',
      'Bid Submission End': '2026-06-05',
      'Bid Opening': '2026-06-06',
      'Validity Date (+120 Days)': '2026-10-03',
      'Part-1 TCR': '2026-06-20',
      'Part-2 TCR': '2026-07-10',
      'Approval Date': '2026-07-28',
      'LOA Date': '2026-08-05',
      'Status': 'LOA Issued',
      'Remarks': 'LOA Issued to L1 bidder M/s Gupta Infra'
    },
    {
      'Tender ID': 'TND-SIL-2026-103',
      'Work Description': 'Repairing of Water Treatment Plant and Pipeline Network at Silewara',
      'Sub-Area': 'Silewara',
      'Value (INR)': 2250000,
      'Published Date': '2026-07-01',
      'Bid Submission End': '2026-07-20',
      'Bid Opening': '2026-07-21',
      'Validity Date (+120 Days)': '2026-11-17',
      'Part-1 TCR': '2026-08-02',
      'Part-2 TCR': '',
      'Approval Date': '',
      'LOA Date': '',
      'Status': 'Technical Evaluation',
      'Remarks': 'Technical scrutiny in progress'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tenders_Template');
  XLSX.writeFile(wb, 'WCL_Tender_Data_Upload_Template.xlsx');
}
