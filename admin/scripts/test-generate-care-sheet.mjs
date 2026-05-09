/**
 * Integration test: POST /api/generate-care-sheet (mammoth + OpenRouter).
 * Requires: dev server (npm run dev), .env with OPENROUTER_API_KEY, and care-sheet-prompt.docx (npm run seed:care-sheet-prompt).
 *
 * Usage: BASE_URL=http://localhost:3000 npm run test:generate-care-sheet
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const base =
  process.env.BASE_URL?.replace(/\/$/, '') ||
  process.env.TEST_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:3000';
const url = `${base}/api/generate-care-sheet`;

const docxPath = path.join(__dirname, '..', 'public', 'prompts', 'care-sheet-prompt.docx');
if (!fs.existsSync(docxPath)) {
  console.error('FAIL: Missing', docxPath, '— run: npm run seed:care-sheet-prompt');
  process.exit(1);
}

const patientData = {
  id: 999,
  name: 'API Test Patient',
  primaryDiagnosis: 'Crohn disease',
  currentDiseaseActivity: 'Mild',
  preferredLanguage: 'English',
};

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ patientData }),
});

let data;
const text = await res.text();
try {
  data = JSON.parse(text);
} catch {
  console.error('FAIL: Non-JSON response', res.status, text.slice(0, 500));
  process.exit(1);
}

if (res.status === 400 && data.error?.includes?.('patient')) {
  console.error('FAIL: Bad request', data);
  process.exit(1);
}

if (!res.ok) {
  console.error('FAIL: HTTP', res.status, JSON.stringify(data, null, 2));
  if (res.status === 404 || text.includes('ECONNREFUSED')) {
    console.error('Hint: start Next with `npm run dev` and set BASE_URL if not on', base);
  }
  process.exit(1);
}

const sheet = data.careSheet;
if (!sheet || typeof sheet !== 'string' || sheet.trim().length < 20) {
  console.error('FAIL: Missing or too-short careSheet', data);
  process.exit(1);
}

console.log('OK: POST /api/generate-care-sheet');
console.log('  URL:', url);
console.log('  careSheet length:', sheet.length, 'chars');
console.log('  preview:', sheet.replace(/\s+/g, ' ').trim().slice(0, 200) + (sheet.length > 200 ? '…' : ''));
process.exit(0);
