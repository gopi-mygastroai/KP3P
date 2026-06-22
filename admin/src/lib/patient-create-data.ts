/** Build Prisma Patient.create `data` from intake JSON (handles MultiStepForm pre-stringified arrays). */

import type { Prisma } from '@prisma/client';
import { composeMontrealClass, hasMontrealSelections, montrealFieldsForDiagnosis } from '@/lib/montreal-classification';
import { normalizeSesCdScoring, parseSesCdScoring, serializeSesCdScoring } from '@/lib/ses-cd-scoring';
import {
  normalizeHarveyBradshawIndex,
  parseHarveyBradshawIndex,
  serializeHarveyBradshawIndex,
} from '@/lib/harvey-bradshaw-index';
import {
  normalizePartialMayoScore,
  parsePartialMayoScore,
  serializePartialMayoScore,
} from '@/lib/partial-mayo-score';
import {
  normalizeUcEndoscopicScoring,
  parseUcEndoscopicScoring,
  serializeUcEndoscopicScoring,
} from '@/lib/uc-endoscopic-scoring';
import {
  normalizeUpperGiFindings,
  parseUpperGiFindings,
  serializeUpperGiFindings,
} from '@/lib/upper-gi-findings';
import { normalizeIbdInvestigations, parseIbdInvestigations, serializeIbdInvestigations } from '@/lib/ibd-investigations';
import {
  normalizeRadiologyInvestigations,
  parseRadiologyInvestigations,
  serializeRadiologyInvestigations,
} from '@/lib/radiology-investigations';
import {
  normalizeCurrentIbdMedications,
  parseCurrentIbdMedications,
  serializeCurrentIbdMedications,
} from '@/lib/current-ibd-medications';

function normalizeJsonArray(val: unknown): string {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const p = JSON.parse(val);
      return JSON.stringify(Array.isArray(p) ? p : []);
    } catch {
      return JSON.stringify([]);
    }
  }
  return JSON.stringify([]);
}

/** Scalar or checkbox-array → stable string for DB (matches legacy intake + assessment forms). */
function normalizeExtrinsicManifestations(val: unknown): string {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t) return '';
    try {
      const p = JSON.parse(t);
      if (Array.isArray(p)) return JSON.stringify(p);
    } catch {
      /* plain label e.g. "Joints" */
    }
    return val.trim();
  }
  return '';
}

function normalizeJsonObject(val: unknown): string {
  if (val && typeof val === 'object' && !Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const p = JSON.parse(val);
      return JSON.stringify(p && typeof p === 'object' && !Array.isArray(p) ? p : {});
    } catch {
      return JSON.stringify({});
    }
  }
  return JSON.stringify({});
}

/** Plain string from radio; still accepts JSON array / array for older submissions. */
function normalizePreferredLanguage(val: unknown): string {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string') return val;
  return '';
}

/** Patient Health Records step: rows of { date, document } → most recent lab date. */
function dateMostRecentLabsFromBody(b: Record<string, unknown>): string {
  if (Array.isArray(b.labReportRows) && b.labReportRows.length > 0) {
    const rows = b.labReportRows as Array<{ date?: string; document?: Record<string, unknown> | null }>;
    const completed = rows.filter((r) => String(r.date || '').trim() && r.document);
    if (completed.length > 0) {
      return completed.reduce((max, r) => (String(r.date) > max ? String(r.date) : max), '');
    }
    return '';
  }
  return typeof b.dateMostRecentLabs === 'string' ? b.dateMostRecentLabs : '';
}

export function patientCreateDataFromBody(body: Record<string, unknown>): Prisma.PatientCreateInput {
  const b = body;
  const dateMostRecentLabs = dateMostRecentLabsFromBody(b);
  return {
    name: typeof b.name === 'string' ? b.name : '',
    email: typeof b.email === 'string' ? b.email.trim() : '',
    mrn: typeof b.mrn === 'string' ? b.mrn : '',
    contactPhone: typeof b.contactPhone === 'string' ? b.contactPhone : '',
    placeOfLiving: typeof b.placeOfLiving === 'string' ? b.placeOfLiving : '',
    referredBy: typeof b.referredBy === 'string' ? b.referredBy : '',
    dateOfBirth: typeof b.dateOfBirth === 'string' ? b.dateOfBirth : '',
    currentAge: parseInt(String(b.currentAge), 10) || 0,
    ageAtDiagnosis: parseInt(String(b.ageAtDiagnosis), 10) || 0,
    sex: typeof b.sex === 'string' ? b.sex : '',
    smokingStatus: typeof b.smokingStatus === 'string' ? b.smokingStatus : '',
    smokingDetails: typeof b.smokingDetails === 'string' ? b.smokingDetails.trim() : '',
    primaryDiagnosis: typeof b.primaryDiagnosis === 'string' ? b.primaryDiagnosis : '',
    diseaseDuration: typeof b.diseaseDuration === 'string' ? b.diseaseDuration : '',
    perianalDiseaseAssessment:
      typeof b.perianalDiseaseAssessment === 'string' ? b.perianalDiseaseAssessment.trim() : '',
    montrealAgeAtDiagnosis:
      typeof b.montrealAgeAtDiagnosis === 'string' ? b.montrealAgeAtDiagnosis : '',
    ucExtent: typeof b.ucExtent === 'string' ? b.ucExtent : '',
    diseaseLocation: typeof b.diseaseLocation === 'string' ? b.diseaseLocation : '',
    diseaseBehavior: typeof b.diseaseBehavior === 'string' ? b.diseaseBehavior : '',
    perianalDisease: typeof b.perianalDisease === 'string' ? b.perianalDisease : '',
    montrealClass: hasMontrealSelections(b)
      ? composeMontrealClass(montrealFieldsForDiagnosis(b.primaryDiagnosis, b))
      : '',
    sesCdScoring: serializeSesCdScoring(normalizeSesCdScoring(parseSesCdScoring(b.sesCdScoring))),
    hbiScoring: serializeHarveyBradshawIndex(
      normalizeHarveyBradshawIndex(parseHarveyBradshawIndex(b.hbiScoring)),
    ),
    partialMayoScoring: serializePartialMayoScore(
      normalizePartialMayoScore(parsePartialMayoScore(b.partialMayoScoring)),
    ),
    sesCdClinicalNotes:
      typeof b.sesCdClinicalNotes === 'string' ? b.sesCdClinicalNotes.trim() : '',
    upperGiFindings: serializeUpperGiFindings(
      normalizeUpperGiFindings(parseUpperGiFindings(b.upperGiFindings)),
    ),
    ucEndoscopicScoring: serializeUcEndoscopicScoring(
      normalizeUcEndoscopicScoring(parseUcEndoscopicScoring(b.ucEndoscopicScoring)),
    ),
    previousSurgeries: normalizeJsonArray(b.previousSurgeries),
    currentDiseaseActivity: typeof b.currentDiseaseActivity === 'string' ? b.currentDiseaseActivity : '',
    stoolFrequency: typeof b.stoolFrequency === 'string' ? b.stoolFrequency : '',
    bloodInStool: typeof b.bloodInStool === 'string' ? b.bloodInStool : '',
    abdominalPain: typeof b.abdominalPain === 'string' ? b.abdominalPain : '',
    impactOnQoL: typeof b.impactOnQoL === 'string' ? b.impactOnQoL : '',
    weightLoss: typeof b.weightLoss === 'string' ? b.weightLoss : '',
    activityScore: typeof b.activityScore === 'string' ? b.activityScore : '',
    dateMostRecentLabs,
    ibdInvestigations: serializeIbdInvestigations(
      normalizeIbdInvestigations(
        parseIbdInvestigations(b.ibdInvestigations, dateMostRecentLabs),
      ),
    ),
    radiologyInvestigations: serializeRadiologyInvestigations(
      normalizeRadiologyInvestigations(parseRadiologyInvestigations(b.radiologyInvestigations)),
    ),
    currentIbdMedicationsRows: serializeCurrentIbdMedications(
      normalizeCurrentIbdMedications(parseCurrentIbdMedications(b.currentIbdMedicationsRows)),
    ),
    failedTreatments: typeof b.failedTreatments === 'string' ? b.failedTreatments : '',
    responseToTreatment: typeof b.responseToTreatment === 'string' ? b.responseToTreatment : '',
    tbScreening: typeof b.tbScreening === 'string' ? b.tbScreening : '',
    hepBSurfaceAg: typeof b.hepBSurfaceAg === 'string' ? b.hepBSurfaceAg : '',
    hepBSurfaceAb: typeof b.hepBSurfaceAb === 'string' ? b.hepBSurfaceAb : '',
    hepBCoreAb: typeof b.hepBCoreAb === 'string' ? b.hepBCoreAb : '',
    antiHcv: typeof b.antiHcv === 'string' ? b.antiHcv : '',
    antiHiv: typeof b.antiHiv === 'string' ? b.antiHiv : '',
    influenza: normalizeJsonObject(b.influenza),
    covid19: normalizeJsonObject(b.covid19),
    pneumococcal: normalizeJsonObject(b.pneumococcal),
    hepatitisB: normalizeJsonObject(b.hepatitisB),
    hepatitisA: normalizeJsonObject(b.hepatitisA),
    hepatitisE: normalizeJsonObject(b.hepatitisE),
    zoster: normalizeJsonObject(b.zoster),
    mmr: normalizeJsonObject(b.mmr),
    varicella: normalizeJsonObject(b.varicella),
    tetanusTdap: normalizeJsonObject(b.tetanusTdap),
    comorbidities: normalizeJsonArray(b.comorbidities),
    extraintestinalManif: normalizeExtrinsicManifestations(b.extraintestinalManif),
    pregnancyPlanning: typeof b.pregnancyPlanning === 'string' ? b.pregnancyPlanning : '',
    preferredLanguage: normalizePreferredLanguage(b.preferredLanguage),
    occupation: typeof b.occupation === 'string' ? b.occupation : '',
    specialConsiderations: typeof b.specialConsiderations === 'string' ? b.specialConsiderations : '',
    assessmentComplete: b.assessmentComplete === true,
    assessmentCurrentStep: (() => {
      const n = parseInt(String(b.assessmentCurrentStep ?? ''), 10);
      return Number.isFinite(n) && n >= 1 && n <= 8 ? n : 1;
    })(),
  };
}
