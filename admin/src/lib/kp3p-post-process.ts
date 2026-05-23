import {
  buildPhysicianContactPatientSheetHtml,
  buildPhysicianPrescriptionHeaderHtml,
} from '@/lib/physician-contact';

const INJECT_MARKERS = {
  'physician-contact-patient': buildPhysicianContactPatientSheetHtml,
  'physician-header-prescription': buildPhysicianPrescriptionHeaderHtml,
} as const;

type InjectMarker = keyof typeof INJECT_MARKERS;

/** Replace LLM placeholders and inject physician contact blocks (client-side, post-LLM). */
export function injectKp3pLocalDetails(
  html: string,
  options: { patientName: string; patientId?: string },
): string {
  let out = html;

  const displayName = options.patientName.trim() || 'Patient';
  out = out.replace(/\[Patient Name\]/gi, displayName);
  out = out.replace(/\[PHYSICIAN_NAME\]/gi, '');
  out = out.replace(/\[Your clinic number\]/gi, '');
  out = out.replace(/\[Your emergency number\]/gi, '');
  out = out.replace(/\[Office hours\]/gi, '');

  if (options.patientId) {
    const idLabel = `Patient ID ${options.patientId}`;
    out = out.replace(new RegExp(idLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), displayName);
  }

  for (const [marker, buildHtml] of Object.entries(INJECT_MARKERS) as [
    InjectMarker,
    () => string,
  ][]) {
    const divPattern = new RegExp(
      `<div\\s+data-kp3p-inject="${marker}"\\s*></div>`,
      'gi',
    );
    out = out.replace(divPattern, buildHtml());
  }

  return out;
}
