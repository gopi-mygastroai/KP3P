import {
  filledInvestigationEntries,
  parseIbdInvestigations,
} from './ibd-investigations';
import {
  parseCurrentIbdMedications,
  type CurrentIbdMedicationRow,
} from './current-ibd-medications';
import { parseSesCdScoring } from './ses-cd-scoring';
import { parseUpperGiFindings, UPPER_GI_SEGMENTS } from './upper-gi-findings';
import { parseUcEndoscopicScoring, uceisTotal } from './uc-endoscopic-scoring';

function medicationRowLabel(row: CurrentIbdMedicationRow): string {
  if (row.otherSpecify?.trim()) return `${row.drugName} (${row.otherSpecify.trim()})`;
  return row.drugName;
}

function formatMedicationRowDetail(row: CurrentIbdMedicationRow): string {
  const parts: string[] = [medicationRowLabel(row), `status: ${row.currentlyTaking}`];
  if (row.drugClass && row.drugClass !== '—') parts.push(`class: ${row.drugClass}`);
  if (row.doseMg) parts.push(`dose: ${row.doseMg}${row.doseUnit ? ` ${row.doseUnit}` : ''}`);
  if (row.frequency) parts.push(`freq: ${row.frequency}`);
  if (row.route) parts.push(`route: ${row.route}`);
  if (row.duration) parts.push(`duration: ${row.duration}`);
  if (row.reasonForStopping && row.currentlyTaking === 'Stopped') {
    parts.push(`reason stopped: ${row.reasonForStopping}`);
  }
  return parts.join(' | ');
}

/** Structured current/prior IBD medication rows for LLM (from assessment table). */
export function formatMedicationHistoryForPrompt(rowsRaw: unknown): string {
  const data = parseCurrentIbdMedications(rowsRaw);
  const relevant = data.rows.filter((row) => {
    const status = row.currentlyTaking.trim();
    return status && status !== 'Never used';
  });

  if (relevant.length === 0) {
    return 'None documented';
  }

  const current = relevant.filter((r) => r.currentlyTaking === 'Yes');
  const stopped = relevant.filter((r) => r.currentlyTaking === 'Stopped');
  const other = relevant.filter((r) => !['Yes', 'Stopped'].includes(r.currentlyTaking));

  const sections: string[] = [];
  if (current.length) {
    sections.push(`Current: ${current.map(formatMedicationRowDetail).join('; ')}`);
  }
  if (stopped.length) {
    sections.push(`Stopped: ${stopped.map(formatMedicationRowDetail).join('; ')}`);
  }
  if (other.length) {
    sections.push(`Other status: ${other.map(formatMedicationRowDetail).join('; ')}`);
  }
  return sections.join(' || ');
}

export function formatInvestigationsForPrompt(ibdInvestigationsRaw: unknown, date?: string): string {
  const entries = filledInvestigationEntries(parseIbdInvestigations(ibdInvestigationsRaw));
  if (entries.length === 0) return 'None documented';
  const datePrefix = date?.trim() ? `Assessment date ${date.trim()}; ` : '';
  return (
    datePrefix +
    entries.map((e) => `${e.label}=${e.value}`).join('; ')
  );
}

export function formatEndoscopicDataForPrompt(input: {
  sesCdScoring?: unknown;
  upperGiFindings?: unknown;
  ucEndoscopicScoring?: unknown;
  sesCdClinicalNotes?: string;
}): string {
  const parts: string[] = [];

  const ses = parseSesCdScoring(input.sesCdScoring);
  const sesFilled = Object.values(ses.scores).some((seg) =>
    Object.values(seg).some((v) => v != null && v !== 0),
  );
  if (sesFilled) {
    parts.push('SES-CD scoring recorded (see segment scores in assessment data)');
  }

  const upperGi = parseUpperGiFindings(input.upperGiFindings);
  const upperGiLines = UPPER_GI_SEGMENTS.map((seg) => {
    const row = upperGi.rows[seg.id];
    if (!row.endoscopicFinding && !row.biopsyTaken) return null;
    return `${seg.label}: finding=${row.endoscopicFinding || '—'}, biopsy=${row.biopsyTaken || '—'}`;
  }).filter(Boolean);
  if (upperGiLines.length) parts.push(`Upper GI: ${upperGiLines.join('; ')}`);

  const uc = parseUcEndoscopicScoring(input.ucEndoscopicScoring);
  const mayoTotal = uc.mayoEndoscopicScore;
  const uceisTotalScore = uceisTotal(uc.uceis);
  if (mayoTotal > 0 || uceisTotalScore > 0) {
    parts.push(`UC endoscopic: Mayo=${mayoTotal}, UCEIS total=${uceisTotalScore}`);
  }

  if (input.sesCdClinicalNotes?.trim()) parts.push(`Clinical notes: ${input.sesCdClinicalNotes.trim()}`);

  return parts.length ? parts.join(' | ') : 'Not provided';
}

export function hasPriorMedicationHistory(rowsRaw: unknown, priorFailed?: string): boolean {
  const data = parseCurrentIbdMedications(rowsRaw);
  const stopped = data.rows.some((r) => r.currentlyTaking === 'Stopped');
  if (stopped) return true;
  if (priorFailed?.trim()) return true;
  return false;
}

export function montrealDetailLine(input: {
  montreal?: string;
  ucExtent?: string;
  diseaseLocation?: string;
  diseaseBehavior?: string;
  perianalDisease?: string;
  montrealAgeAtDiagnosis?: string;
}): string {
  const parts = [
    input.montreal?.trim() && `Class: ${input.montreal.trim()}`,
    input.ucExtent?.trim() && `UC extent: ${input.ucExtent.trim()}`,
    input.diseaseLocation?.trim() && `CD location: ${input.diseaseLocation.trim()}`,
    input.diseaseBehavior?.trim() && `CD behavior: ${input.diseaseBehavior.trim()}`,
    input.perianalDisease?.trim() && `Perianal: ${input.perianalDisease.trim()}`,
    input.montrealAgeAtDiagnosis?.trim() && `Montreal age at dx: ${input.montrealAgeAtDiagnosis.trim()}`,
  ].filter(Boolean);
  return parts.length ? parts.join(' | ') : 'Not specified';
}
