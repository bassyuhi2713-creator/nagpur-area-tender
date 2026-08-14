import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Anti-caching middleware for API routes to guarantee instant multi-device reflection
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

const DATA_DIR = path.join(__dirname, 'data_store');
const TENDERS_FILE = path.join(DATA_DIR, 'tenders.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure data storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data if file doesn't exist
function calculateBidValidity(endDateStr: string): string {
  if (!endDateStr) return '';
  const date = new Date(endDateStr);
  if (isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 120);
  return date.toISOString().split('T')[0];
}

function getRelativeDateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function getEndDateForValidityIn(validityDaysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + validityDaysFromNow - 120);
  return d.toISOString().split('T')[0];
}

function getInitialSeedTenders(): any[] {
  return [];
}

function getInitialSeedLogs(): any[] {
  return [];
}

// Read & Write Helpers
function readTenders(): any[] {
  try {
    if (!fs.existsSync(TENDERS_FILE)) {
      const initial = getInitialSeedTenders();
      fs.writeFileSync(TENDERS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(TENDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading tenders file:', err);
    return getInitialSeedTenders();
  }
}

function writeTenders(tenders: any[]): void {
  try {
    fs.writeFileSync(TENDERS_FILE, JSON.stringify(tenders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing tenders file:', err);
  }
}

function readLogs(): any[] {
  try {
    if (!fs.existsSync(LOGS_FILE)) {
      const initial = getInitialSeedLogs();
      fs.writeFileSync(LOGS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading logs file:', err);
    return getInitialSeedLogs();
  }
}

function writeLogs(logs: any[]): void {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing logs file:', err);
  }
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET all tenders
app.get('/api/tenders', (req, res) => {
  const tenders = readTenders();
  res.json({ success: true, data: tenders, count: tenders.length, timestamp: Date.now() });
});

// POST / PUT single tender
app.post('/api/tenders', (req, res) => {
  const tender = req.body;
  if (!tender || !tender.id || !tender.description) {
    return res.status(400).json({ success: false, error: 'Invalid tender data: id and description are required' });
  }

  const tenders = readTenders();
  const existingIdx = tenders.findIndex((t) => t.id === tender.id);

  if (existingIdx >= 0) {
    tenders[existingIdx] = { ...tenders[existingIdx], ...tender, updatedAt: new Date().toISOString() };
  } else {
    tenders.unshift({ ...tender, createdAt: tender.createdAt || new Date().toISOString() });
  }

  writeTenders(tenders);
  res.json({ success: true, data: tender, totalCount: tenders.length });
});

// POST batch tenders (Excel / CSV upload)
app.post('/api/tenders/batch', (req, res) => {
  const { tenders: incomingTenders, mode = 'merge' } = req.body;
  if (!Array.isArray(incomingTenders)) {
    return res.status(400).json({ success: false, error: 'Invalid payload: tenders array expected' });
  }

  let finalTenders: any[] = [];
  const currentTenders = readTenders();

  if (mode === 'replace') {
    finalTenders = incomingTenders.map((t, idx) => ({
      ...t,
      id: t.id || `TND-IMP-${Date.now()}-${idx + 1}`,
      createdAt: t.createdAt || new Date().toISOString()
    }));
  } else {
    // Merge mode: update existing by ID, append new ones
    finalTenders = [...currentTenders];
    for (const item of incomingTenders) {
      if (!item.description) continue;
      const itemId = item.id || `TND-IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const idx = finalTenders.findIndex((t) => t.id === itemId || (t.description === item.description && t.subArea === item.subArea));
      if (idx >= 0) {
        finalTenders[idx] = { ...finalTenders[idx], ...item, id: finalTenders[idx].id, updatedAt: new Date().toISOString() };
      } else {
        finalTenders.unshift({ ...item, id: itemId, createdAt: item.createdAt || new Date().toISOString() });
      }
    }
  }

  writeTenders(finalTenders);

  // Add audit log for batch import
  const logs = readLogs();
  logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleString(),
    user: req.body.user || 'Tender Cell',
    role: req.body.role || 'Tender Cell',
    action: 'Excel Data Imported',
    details: `Imported ${incomingTenders.length} tender records (${mode === 'replace' ? 'Full Replace' : 'Merge / Update'}). Total active: ${finalTenders.length}`
  });
  writeLogs(logs);

  res.json({
    success: true,
    message: `Successfully processed ${incomingTenders.length} tender records`,
    data: finalTenders,
    count: finalTenders.length
  });
});

// DELETE single tender
app.delete('/api/tenders/:id', (req, res) => {
  const id = req.params.id;
  let tenders = readTenders();
  const initialLen = tenders.length;
  tenders = tenders.filter((t) => t.id !== id);

  if (tenders.length === initialLen) {
    return res.status(404).json({ success: false, error: 'Tender not found' });
  }

  writeTenders(tenders);
  res.json({ success: true, message: `Tender ${id} deleted`, totalCount: tenders.length });
});

// GET logs
app.get('/api/logs', (req, res) => {
  const logs = readLogs();
  res.json({ success: true, data: logs });
});

// POST log
app.post('/api/logs', (req, res) => {
  const log = req.body;
  if (!log || !log.action) {
    return res.status(400).json({ success: false, error: 'Log action required' });
  }
  const logs = readLogs();
  const newLog = {
    id: log.id || `log-${Date.now()}`,
    timestamp: log.timestamp || new Date().toLocaleString(),
    user: log.user || 'System',
    role: log.role || 'System',
    action: log.action,
    details: log.details || ''
  };
  logs.unshift(newLog);
  writeLogs(logs);
  res.json({ success: true, data: newLog });
});

// POST reset tenders
app.post('/api/reset', (req, res) => {
  const initial = getInitialSeedTenders();
  writeTenders(initial);
  res.json({ success: true, message: 'Database reset to default seed records', data: initial });
});

// ================= VITE / STATIC SERVING =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WCL Tender Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
