import {
  filledInvestigationEntries,
  parseIbdInvestigations,
} from './ibd-investigations';
import {
  medicationRowHasData,
  medicationRowLabel,
  parseCurrentIbdMedications,
  type CurrentIbdMedicationRow,
} from './current-ibd-medications';
import { parseSesCdScoring } from './ses-cd-scoring';
import {
  hbiInterpretation,
  hbiTotal,
  parseHarveyBradshawIndex,
} from './harvey-bradshaw-index';
import {
  partialMayoInterpretation,
  partialMayoTotal,
  parsePartialMayoScore,
} from './partial-mayo-score';
import { parseUpperGiFindings, UPPER_GI_SEGMENTS } from './upper-gi-findings';
import { parseUcEndoscopicScoring, uceisTotal } from './uc-endoscopic-scoring';

function formatMedicationRowDetail(row: CurrentIbdMedicationRow): string {
  const parts: string[] = [medicationRowLabel(row)];
  if (row.dose) parts.push(`dose: ${row.dose}${row.doseUnit ? ` ${row.doseUnit}` : ''}`);
  if (row.startDate) parts.push(`start: ${row.startDate}`);
  if (row.ongoing) {
    parts.push('status: ongoing');
  } else if (row.endDate) {
    parts.push(`end: ${row.endDate}`);
  }
  if (row.reasonForStopping) parts.push(`reason stopped: ${row.reasonForStopping}`);
  return parts.join(' | ');
}

/** Structured current/prior IBD medication rows for LLM (from assessment table). */
export function formatMedicationHistoryForPrompt(rowsRaw: unknown): string {
  const data = parseCurrentIbdMedications(rowsRaw);
  const relevant = data.rows.filter(medicationRowHasData);

  if (relevant.length === 0) {
    return 'None documented';
  }

  const current = relevant.filter((row) => row.ongoing);
  const stopped = relevant.filter((row) => !row.ongoing && (row.endDate || row.reasonForStopping));
  const other = relevant.filter((row) => !row.ongoing && !row.endDate && !row.reasonForStopping);

  const sections: string[] = [];
  if (current.length) {
    sections.push(`Current: ${current.map(formatMedicationRowDetail).join('; ')}`);
  }
  if (stopped.length) {
    sections.push(`Stopped: ${stopped.map(formatMedicationRowDetail).join('; ')}`);
  }
  if (other.length) {
    sections.push(`Other: ${other.map(formatMedicationRowDetail).join('; ')}`);
  }
  return sections.join(' || ');
}

export function formatInvestigationsForPrompt(ibdInvestigationsRaw: unknown, date?: string): string {
  const data = parseIbdInvestigations(ibdInvestigationsRaw, date);
  const parts = data.sets
    .map((set, index) => {
      const entries = filledInvestigationEntries(set);
      const datePrefix = set.assessmentDate.trim()
        ? `Assessment date ${set.assessmentDate.trim()}`
        : `Set ${index + 1}`;
      if (entries.length === 0) {
        return set.assessmentDate.trim() ? `${datePrefix}: no values recorded` : null;
      }
      return `${datePrefix}: ${entries.map((e) => `${e.label}=${e.value}`).join('; ')}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(' || ') : 'None documented';
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
    const dateNote = ses.scoringDate?.trim() ? ` (scoring date: ${ses.scoringDate.trim()})` : '';
    parts.push(`SES-CD scoring recorded${dateNote} (see segment scores in assessment data)`);
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
    const dateNote = uc.scoringDate?.trim() ? ` (scoring date: ${uc.scoringDate.trim()})` : '';
    parts.push(`UC endoscopic${dateNote}: Mayo=${mayoTotal}, UCEIS total=${uceisTotalScore}`);
  }

  if (input.sesCdClinicalNotes?.trim()) parts.push(`Clinical notes: ${input.sesCdClinicalNotes.trim()}`);

  return parts.length ? parts.join(' | ') : 'Not provided';
}

export function formatHbiForPrompt(hbiScoringRaw: unknown): string {
  const hbi = parseHarveyBradshawIndex(hbiScoringRaw);
  const total = hbiTotal(hbi);
  const interpretation = hbiInterpretation(total);
  const dateNote = hbi.assessmentDate?.trim() ? `assessment date ${hbi.assessmentDate.trim()}, ` : '';
  return `${dateNote}total ${total} (${interpretation.label}): wellbeing=${hbi.generalWellbeing}, pain=${hbi.abdominalPain}, stools=${hbi.liquidSoftStools}, mass=${hbi.abdominalMass}, complications=${hbi.complications}`;
}

export function formatPartialMayoForPrompt(partialMayoScoringRaw: unknown): string {
  const pMayo = parsePartialMayoScore(partialMayoScoringRaw);
  const total = partialMayoTotal(pMayo);
  const interpretation = partialMayoInterpretation(total);
  const dateNote = pMayo.assessmentDate?.trim() ? `assessment date ${pMayo.assessmentDate.trim()}, ` : '';
  return `${dateNote}total ${total}/9 (${interpretation.label}): stool frequency=${pMayo.stoolFrequency}, rectal bleeding=${pMayo.rectalBleeding}, PGA=${pMayo.physiciansGlobalAssessment}; action=${interpretation.action}`;
}

export function hasPriorMedicationHistory(rowsRaw: unknown, priorFailed?: string): boolean {
  const data = parseCurrentIbdMedications(rowsRaw);
  const stopped = data.rows.some(
    (row) => medicationRowHasData(row) && (!row.ongoing && (row.endDate || row.reasonForStopping)),
  );
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
