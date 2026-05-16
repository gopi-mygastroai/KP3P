/**
 * Report character counts and token estimates for the care-sheet LLM payload.
 *
 * Usage (from admin/):
 *   npx ts-node -P tsconfig.scripts.json scripts/countLLMPayloadTokens.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CARE_SHEET_SYSTEM_PROMPT } from '../src/lib/care-sheet-system-prompt';
import { loadIbdRulebookText } from '../src/lib/load-ibd-rulebook';
import { breakdownCareSheetPayload } from '../src/lib/llm-payload-stats';
import { buildKP3PPrompt, type PatientData } from '../src/lib/kp3p-prompt';

const adminRoot = path.join(__dirname, '..');
dotenv.config({ path: path.join(adminRoot, '.env') });
dotenv.config({ path: path.join(adminRoot, '.env.local'), override: true });

/** Representative patient for sizing (matches typical assessment fields). */
const SAMPLE_PATIENT: PatientData = {
  name: 'Patient ID 42',
  id: '42',
  age: 45,
  sex: 'Female',
  occupation: 'Teacher',
  location: 'Urban clinic',
  smoking: 'Never',
  diagnosis: "Crohn's disease",
  montreal: 'L2B1',
  severity: 'Moderate',
  duration: '8 years',
  ageAtDx: 37,
  ageAtDiagnosis: 37,
  priorSurgeries: 'None',
  bowelFreq: '4–6/day',
  bloodInStool: 'Occasional',
  abdPain: 'Mild',
  weightLoss: 'No',
  hb: '11.2 g/dL',
  tlc: '7.8',
  platelets: '320',
  crp: '18 mg/L',
  albumin: '3.6 g/dL',
  mayoScore: 'N/A',
  endoscopyFindings: 'Moderate ileocolonic inflammation',
  imagingFindings: 'Terminal ileum thickening',
  dexa: 'Not done',
  currentMeds: 'Adalimumab 40 mg q2w',
  treatmentResponse: 'Partial response',
  tdm: 'Trough 6 µg/mL',
  priorFailed: 'Azathioprine intolerance',
  tbStatus: 'Negative',
  hbsAg: 'Negative',
  antiHBs: 'Positive (immune)',
  antiHBc: 'Negative',
  antiHCV: 'Negative',
  antiHIV: 'Negative',
  comorbidities: ['Hypertension'],
  eim: 'None',
  specialConsiderations: 'Planning pregnancy in 12 months',
  patientLanguage: 'English',
  dateOfBirth: '1980-06-15',
  vaccineInfluenza: '2024-10',
  vaccineCovid: '2024-03',
  vaccinePneumococcal: '2023',
  vaccineHepB: 'Complete series',
  vaccineHepA: '2022',
  vaccineHepE: 'Unknown',
  vaccineZoster: '2023',
  vaccineTetanus: '2021',
  vaccineMmr: 'Immune',
};

async function geminiTokenCount(
  systemPrompt: string,
  rulebookText: string,
  patientPrompt: string,
): Promise<number | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  });

  const result = await model.countTokens({
    contents: [
      {
        role: 'user',
        parts: [{ text: rulebookText }, { text: patientPrompt }],
      },
    ],
  });

  return result.totalTokens;
}

async function main(): Promise<void> {
  const rulebookText = await loadIbdRulebookText();
  const patientPrompt = buildKP3PPrompt(SAMPLE_PATIENT);
  const stats = breakdownCareSheetPayload(
    CARE_SHEET_SYSTEM_PROMPT,
    rulebookText,
    patientPrompt,
  );

  console.log('KP-3P care sheet — LLM input payload\n');
  console.log(`  System prompt:     ${stats.systemPromptChars.toLocaleString()} chars`);
  console.log(`  Rulebook (PDF):    ${stats.rulebookChars.toLocaleString()} chars`);
  console.log(`  Patient prompt:    ${stats.patientPromptChars.toLocaleString()} chars`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  Total characters:  ${stats.totalChars.toLocaleString()}`);
  console.log(`  Estimated tokens:  ~${stats.estimatedTotalTokens.toLocaleString()} (chars ÷ 4)`);

  const geminiTokens = await geminiTokenCount(
    CARE_SHEET_SYSTEM_PROMPT,
    rulebookText,
    patientPrompt,
  );
  if (geminiTokens != null) {
    console.log(`  Gemini countTokens: ${geminiTokens.toLocaleString()} (system + user; gemini-2.5-flash API)`);
  } else {
    console.log('  Gemini countTokens: skipped (GEMINI_API_KEY not set)');
  }
}

main().catch((err: unknown) => {
  console.error('FAIL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
