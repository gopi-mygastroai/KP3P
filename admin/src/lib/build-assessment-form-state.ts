import { preferredLanguageScalarForForm } from '@/lib/preferredLanguagePrompt';
import { normalizeSmokingStatusForForm } from '@/lib/smoking';
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

  return {
    ...patient,
    previousSurgeries,
    previousTreatmentsTried,
    comorbidities,
    documents,
    smokingStatus: normalizeSmokingStatusForForm(patient.smokingStatus),
    smokingDetails: patient.smokingDetails ?? '',
    preferredLanguage: preferredLanguageScalarForForm(patient.preferredLanguage),
  };
}

export { assessmentField };
