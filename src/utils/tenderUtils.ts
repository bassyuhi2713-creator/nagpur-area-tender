import { Tender, SubArea } from '../types';

/**
 * Calculates +120 days from a given date string (YYYY-MM-DD)
 */
export function calculateBidValidity(endDateStr: string): string {
  if (!endDateStr) return '';
  const date = new Date(endDateStr);
  if (isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 120);
  return date.toISOString().split('T')[0];
}

/**
 * Gets days remaining until bid validity date.
 * Positive number = days until expiry.
 * Negative number = days past expiry.
 */
export function getDaysUntilValidity(validDateStr: string): number | null {
  if (!validDateStr) return null;
  const validDate = new Date(validDateStr);
  if (isNaN(validDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  validDate.setHours(0, 0, 0, 0);

  const diffTime = validDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks if bid validity is coming up in the next 20 days (and not closed/cancelled/issued)
 * Returns true if 0 <= daysRemaining <= 20 (or overdue if active)
 */
export function isUrgentValidity(tender: Tender): boolean {
  if (tender.status === 'LOA Issued' || tender.status === 'Cancelled') {
    return false;
  }
  const days = getDaysUntilValidity(tender.validDate);
  if (days === null) return false;
  return days <= 20; // Highlight if validity is within 20 days or overdue
}

export function formatINR(val: number): string {
  if (isNaN(val)) return '₹ 0';
  return '₹ ' + val.toLocaleString('en-IN');
}

export function formatAmountInLakhs(val: number): string {
  const lakhs = val / 100000;
  return `₹ ${lakhs.toFixed(2)} Lakhs`;
}

export const SUB_AREAS: SubArea[] = [
  'Saoner',
  'Silewara',
  'Bhanegaon Singori',
  'Kamptee',
  'Gondegaon',
  'Nagpur Area Execution',
];

export function exportToCSV(tenders: Tender[], filenamePrefix = 'WCL_Tenders') {
  const headers = [
    'S.No',
    'Work Description',
    'Sub-Area',
    'Value (INR)',
    'Published Date',
    'Bid Submission End',
    'Bid Opening',
    'Validity Date (+120 Days)',
    'Days Remaining',
    'Urgent (<=20 Days)',
    'Part-1 TCR',
    'Part-2 TCR',
    'Approval Date',
    'LOA Date',
    'Status',
    'Remarks'
  ];

  const rows = tenders.map((t, idx) => {
    const days = getDaysUntilValidity(t.validDate);
    const urgent = isUrgentValidity(t) ? 'YES' : 'NO';
    return [
      idx + 1,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.subArea}"`,
      t.value,
      t.pubDate || '',
      t.endDate || '',
      t.openDate || '',
      t.validDate || '',
      days !== null ? days : '',
      urgent,
      t.tcr1 || '',
      t.tcr2 || '',
      t.appDate || '',
      t.loaDate || '',
      t.status,
      `"${(t.remarks || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
