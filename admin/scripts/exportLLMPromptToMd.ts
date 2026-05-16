/**
 * Writes the exact care-sheet LLM prompt (system + rulebook + patient) to a markdown file.
 *
 * Usage (from admin/):
 *   npx ts-node -P tsconfig.scripts.json scripts/exportLLMPromptToMd.ts
 */
import fs from 'fs';
import path from 'path';
import { CARE_SHEET_SYSTEM_PROMPT } from '../src/lib/care-sheet-system-prompt';
import { loadIbdRulebookText } from '../src/lib/load-ibd-rulebook';
import { breakdownCareSheetPayload } from '../src/lib/llm-payload-stats';
import { buildKP3PPrompt, type PatientData } from '../src/lib/kp3p-prompt';

const OUTPUT_PATH = path.join(__dirname, '..', 'LLM-Prompt-Export.md');

/** Same sample as countLLMPayloadTokens.ts — patient block varies per real request. */
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

function fence(text: string): string {
  const tick = '```';
  return `${tick}text\n${text}\n${tick}`;
}

async function main(): Promise<void> {
  const rulebookText = await loadIbdRulebookText();
  const patientPrompt = buildKP3PPrompt(SAMPLE_PATIENT);
  const stats = breakdownCareSheetPayload(
    CARE_SHEET_SYSTEM_PROMPT,
    rulebookText,
    patientPrompt,
  );

  const md = `# KP-3P Care Sheet — Exact LLM Prompt Export

Generated: ${new Date().toISOString()}

Source: \`POST /api/generate-caresheet\` → \`llmProvider.generateCarePlan()\`

## Message structure (Claude & Gemini)

| Part | Role | Source |
|------|------|--------|
| 1 | **System** | \`CARE_SHEET_SYSTEM_PROMPT\` |
| 2 | **User (first text block)** | \`medical-doc/IBD_Clinical_Rulebook_Final.pdf\` (extracted text) |
| 3 | **User (second text block)** | \`buildKP3PPrompt(patient)\` |

Gemini maps part 1 to \`systemInstruction\`; parts 2–3 are user \`contents\` in order.
Claude maps part 1 to \`system\`; parts 2–3 are a single user message with two text blocks.

## Payload size (this export)

| Component | Characters | Est. tokens (÷4) |
|-----------|------------|----------------|
| System prompt | ${stats.systemPromptChars.toLocaleString()} | ${Math.ceil(stats.systemPromptChars / 4).toLocaleString()} |
| Rulebook | ${stats.rulebookChars.toLocaleString()} | ${Math.ceil(stats.rulebookChars / 4).toLocaleString()} |
| Patient prompt | ${stats.patientPromptChars.toLocaleString()} | ${Math.ceil(stats.patientPromptChars / 4).toLocaleString()} |
| **Total input** | **${stats.totalChars.toLocaleString()}** | **~${stats.estimatedTotalTokens.toLocaleString()}** |

> **Note:** The patient block below uses sample patient \`ID 42\`. Each real request substitutes that patient's assessment data via \`buildKP3PPrompt\`.

---

## 1. System prompt

${fence(CARE_SHEET_SYSTEM_PROMPT)}

---

## 2. User message — rulebook (\`IBD_Clinical_Rulebook_Final.pdf\`)

${fence(rulebookText)}

---

## 3. User message — patient KP-3P prompt (sample patient)

${fence(patientPrompt)}
`;

  fs.writeFileSync(OUTPUT_PATH, md, 'utf8');
  console.log(`Wrote ${OUTPUT_PATH} (${stats.totalChars.toLocaleString()} chars)`);
}

main().catch((err: unknown) => {
  console.error('FAIL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
