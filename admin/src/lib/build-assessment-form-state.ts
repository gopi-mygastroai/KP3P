import { composeMontrealClass, hasMontrealSelections, montrealFieldsForDiagnosis } from '@/lib/montreal-classification';
import { normalizeSesCdScoring, parseSesCdScoring, serializeSesCdScoring } from '@/lib/ses-cd-scoring';
import {
  normalizeUpperGiFindings,
  parseUpperGiFindings,
  serializeUpperGiFindings,
} from '@/lib/upper-gi-findings';
import {
  normalizeUcEndoscopicScoring,
  parseUcEndoscopicScoring,
  serializeUcEndoscopicScoring,
} from '@/lib/uc-endoscopic-scoring';
import { preferredLanguageScalarForForm } from '@/lib/preferredLanguagePrompt';
import { normalizeSmokingStatusForForm } from '@/lib/smoking';
import {
  normalizeIbdInvestigations,
  parseIbdInvestigations,
  serializeIbdInvestigations,
} from '@/lib/ibd-investigations';
import {
  normalizeCurrentIbdMedications,
  parseCurrentIbdMedications,
  serializeCurrentIbdMedications,
} from '@/lib/current-ibd-medications';
import type { PatientWithUser, AssessmentFormState } from '@/types/assessment-form';

function assessmentField(data: AssessmentFormState, key: string): unknown {
  return (data as Record<string, unknown>)[key];
}

export function buildAssessmentFormState(patient: PatientWithUser): AssessmentFormState {
  let previousSurgeries: string | string[] = patient.previousSurgeries;
  try {
    if (typeof previousSurgeries === 'string') {
      const p = JSON.parse(previousSurgeries) as unknown;
      previousSurgeries = Array.isArray(p) ? (p as string[]) : previousSurgeries;
    }
  } catch {
    /* keep string */
  }

  let comorbidities: string | string[] = patient.comorbidities;
  try {
    if (typeof comorbidities === 'string') {
      const p = JSON.parse(comorbidities) as unknown;
      comorbidities = Array.isArray(p) ? (p as string[]) : comorbidities;
    }
  } catch {
    /* keep string */
  }

  const montrealClass = hasMontrealSelections(patient)
    ? composeMontrealClass(montrealFieldsForDiagnosis(patient.primaryDiagnosis, patient))
    : '';

  const sesCdScoring = serializeSesCdScoring(
    normalizeSesCdScoring(parseSesCdScoring(patient.sesCdScoring)),
  );

  const upperGiFindings = serializeUpperGiFindings(
    normalizeUpperGiFindings(parseUpperGiFindings(patient.upperGiFindings)),
  );

  const ucEndoscopicScoring = serializeUcEndoscopicScoring(
    normalizeUcEndoscopicScoring(parseUcEndoscopicScoring(patient.ucEndoscopicScoring)),
  );

  const parsedInvestigations = parseIbdInvestigations(patient.ibdInvestigations);
  const ibdInvestigations = serializeIbdInvestigations(parsedInvestigations);

  const currentIbdMedicationsRows = serializeCurrentIbdMedications(
    normalizeCurrentIbdMedications(parseCurrentIbdMedications(patient.currentIbdMedicationsRows)),
  );

  return {
    ...patient,
    previousSurgeries,
    comorbidities,
    montrealClass,
    sesCdScoring,
    upperGiFindings,
    ucEndoscopicScoring,
    ibdInvestigations,
    currentIbdMedicationsRows,
    mmr: patient.mmr ?? '{}',
    varicella: patient.varicella ?? '{}',
    smokingStatus: normalizeSmokingStatusForForm(patient.smokingStatus),
    smokingDetails: patient.smokingDetails ?? '',
    preferredLanguage: preferredLanguageScalarForForm(patient.preferredLanguage),
  };
}

/** Patient scalar / JSON fields sent to PUT /api/patient/[id] (excludes relations and metadata). */
const PATIENT_SAVE_FIELD_KEYS = [
  'name',
  'email',
  'mrn',
  'contactPhone',
  'placeOfLiving',
  'referredBy',
  'dateOfBirth',
  'currentAge',
  'ageAtDiagnosis',
  'sex',
  'smokingStatus',
  'smokingDetails',
  'primaryDiagnosis',
  'diseaseDuration',
  'perianalDiseaseAssessment',
  'montrealAgeAtDiagnosis',
  'ucExtent',
  'diseaseLocation',
  'diseaseBehavior',
  'perianalDisease',
  'montrealClass',
  'sesCdScoring',
  'sesCdClinicalNotes',
  'upperGiFindings',
  'ucEndoscopicScoring',
  'previousSurgeries',
  'currentDiseaseActivity',
  'stoolFrequency',
  'bloodInStool',
  'abdominalPain',
  'impactOnQoL',
  'weightLoss',
  'activityScore',
  'dateMostRecentLabs',
  'ibdInvestigations',
  'currentIbdMedicationsRows',
  'failedTreatments',
  'responseToTreatment',
  'tbScreening',
  'hepBSurfaceAg',
  'hepBSurfaceAb',
  'hepBCoreAb',
  'antiHcv',
  'antiHiv',
  'influenza',
  'covid19',
  'pneumococcal',
  'hepatitisB',
  'hepatitisA',
  'hepatitisE',
  'zoster',
  'mmr',
  'varicella',
  'tetanusTdap',
  'comorbidities',
  'extraintestinalManif',
  'pregnancyPlanning',
  'preferredLanguage',
  'occupation',
  'specialConsiderations',
  'assessmentComplete',
  'assessmentCurrentStep',
] as const;

/** Build a JSON-safe payload for assessment saves (no nested user / Prisma metadata). */
export function buildAssessmentSavePayload(
  formData: AssessmentFormState,
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  const source = formData as Record<string, unknown>;
  const payload: Record<string, unknown> = {};

  for (const key of PATIENT_SAVE_FIELD_KEYS) {
    if (key in source) {
      payload[key] = source[key];
    }
  }

  return { ...payload, ...overrides };
}

export { assessmentField };
