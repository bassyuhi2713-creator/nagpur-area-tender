import { Tender, AuditLog, SubArea } from '../types';

export interface CredentialsConfig {
  staffofficer: { id: string; pass: string; name: string };
  sae: Record<string, { pass: string; subArea: SubArea; name: string }>;
  tendercell: { id: string; pass: string; name: string };
  admin: { id: string; pass: string; name: string };
}

export const CREDENTIALS: CredentialsConfig = {
  staffofficer: { id: 'staffofficer', pass: 'socivil123', name: 'Staff Officer (Civil)' },
  sae: {
    saoner: { pass: 'saonersae234', subArea: 'Saoner', name: 'SAE Saoner' },
    silewara: { pass: 'silewarasae345', subArea: 'Silewara', name: 'SAE Silewara' },
    bhanegaonsingori: { pass: 'bhanegaonsingorisae456', subArea: 'Bhanegaon Singori', name: 'SAE Bhanegaon Singori' },
    kamptee: { pass: 'kampteesae567', subArea: 'Kamptee', name: 'SAE Kamptee' },
    gondegaon: { pass: 'gondegaonsae678', subArea: 'Gondegaon', name: 'SAE Gondegaon' },
    nagpurareaexecution: { 
      pass: 'nagpurareaexecutioncivils', 
      subArea: 'Nagpur Area Execution', 
      name: 'SAE Nagpur Area Execution' 
    }
  },
  tendercell: { id: 'tendercellna', pass: 'nagpurareaofficecivil', name: 'Tender Cell' },
  admin: { id: 'admintender', pass: 'admincivil', name: 'Admin / Auditor' }
};

export const INITIAL_TENDERS: Tender[] = [];

export const INITIAL_LOGS: AuditLog[] = [];
