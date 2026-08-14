export type UserRole = 'Staff Officer' | 'SAE' | 'Tender Cell' | 'Admin';

export type SubArea = 
  | 'Saoner'
  | 'Silewara'
  | 'Bhanegaon Singori'
  | 'Kamptee'
  | 'Gondegaon'
  | 'Nagpur Area Execution';

export interface User {
  role: UserRole;
  id: string;
  name: string;
  subArea?: SubArea;
}

export type TenderStatus = 
  | 'Published'
  | 'Technical Evaluation'
  | 'Financial Evaluation'
  | 'TCR Process'
  | 'LOA Issued'
  | 'Cancelled';

export interface Tender {
  id: string;
  description: string;
  subArea: SubArea;
  value: number; // in INR
  pubDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  openDate: string; // YYYY-MM-DD
  validDate: string; // Auto YYYY-MM-DD (+120 days from endDate)
  tcr1?: string;
  tcr2?: string;
  appDate?: string;
  loaDate?: string;
  status: TenderStatus;
  remarks?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}
