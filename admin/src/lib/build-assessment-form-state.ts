import { composeMontrealClass, hasMontrealSelections } from '@/lib/montreal-classification';
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

  let previousTreatmentsTried: string | string[] = patient.previousTreatmentsTried;
  try {
    if (typeof previousTreatmentsTried === 'string') {
      const p = JSON.parse(previousTreatmentsTried) as unknown;
      previousTreatmentsTried = Array.isArray(p) ? (p as string[]) : previousTreatmentsTried;
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

  let documents: unknown = patient.documents ?? '[]';
  if (typeof documents === 'string') {
    try {
      const p = JSON.parse(documents) as unknown;
      documents = Array.isArray(p) ? p : [];
    } catch {
      documents = [];
    }
  } else if (!Array.isArray(documents)) {
    documents = [];
  }

  const montrealClass = hasMontrealSelections(patient)
    ? composeMontrealClass(patient)
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

  const mmr =
    String(patient.mmr ?? '').trim() && patient.mmr !== '{}'
      ? patient.mmr
      : String(patient.mmrVaricella ?? '').trim() && patient.mmrVaricella !== '{}'
        ? patient.mmrVaricella
        : '{}';

  return {
    ...patient,
    previousSurgeries,
    previousTreatmentsTried,
    comorbidities,
    documents,
    montrealClass,
    sesCdScoring,
    upperGiFindings,
    ucEndoscopicScoring,
    ibdInvestigations,
    mmr,
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
  'recentLabValues',
  'ibdInvestigations',
  'dateMostRecentColonoscopy',
  'colonoscopyFindings',
  'recentImaging',
  'mostRecentDexaScan',
  'currentIbdMedications',
  'failedTreatments',
  'tdmResults',
  'currentSupplements',
  'responseToTreatment',
  'steroidUse',
  'previousTreatmentsTried',
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
  'mmrVaricella',
  'tetanusTdap',
  'comorbidities',
  'extraintestinalManif',
  'pregnancyPlanning',
  'preferredLanguage',
  'occupation',
  'specialConsiderations',
  'documents',
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
