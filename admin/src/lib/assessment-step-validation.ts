import { assessmentField } from '@/lib/build-assessment-form-state';
import { parseIbdInvestigations } from '@/lib/ibd-investigations';
import {
  parseInfectionScreening,
  TB_SCREENING_SUBFIELDS,
  INFECTION_SCREENING_FIELDS,
  type InfectionScreeningData,
} from '@/lib/infection-screening';
import { isFutureIsoDate } from '@/lib/iso-date';
import {
  normalizeHarveyBradshawIndex,
  parseHarveyBradshawIndex,
} from '@/lib/harvey-bradshaw-index';
import { montrealValidationFieldErrors } from '@/lib/montreal-classification';
import {
  normalizePartialMayoScore,
  parsePartialMayoScore,
} from '@/lib/partial-mayo-score';
import {
  normalizeSesCdScoring,
  parseSesCdScoring,
} from '@/lib/ses-cd-scoring';
import {
  normalizeUcEndoscopicScoring,
  parseUcEndoscopicScoring,
} from '@/lib/uc-endoscopic-scoring';
import type { AssessmentFormState } from '@/types/assessment-form';

export type AssessmentFieldError = {
  fieldKey: string;
  label: string;
};

export type AssessmentStepValidationResult = {
  errors: AssessmentFieldError[];
};

function isNonEmpty(v: unknown): boolean {
  return String(v ?? '').trim() !== '';
}

function pushMissing(
  errors: AssessmentFieldError[],
  key: string,
  label: string,
  isEmpty: boolean,
): void {
  if (isEmpty) errors.push({ fieldKey: key, label });
}

function parseStringArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* ignore */
    }
  }
  return [];
}

function infectionScreeningFieldErrors(data: InfectionScreeningData): AssessmentFieldError[] {
  const errors: AssessmentFieldError[] = [];
  data.sets.forEach((set, index) => {
    const prefix = data.sets.length > 1 ? `Screening ${index + 1}: ` : '';
    const key = (fieldId: string) => `infectionScreening.${index}.${fieldId}`;

    if (!set.screeningDate.trim()) {
      errors.push({ fieldKey: key('screeningDate'), label: `${prefix}Screening date` });
    }
    for (const field of TB_SCREENING_SUBFIELDS) {
      if (!String(set[field.id] ?? '').trim()) {
        errors.push({ fieldKey: key(field.id), label: `${prefix}${field.label}` });
      }
    }
    for (const field of INFECTION_SCREENING_FIELDS) {
      if (!String(set[field.id] ?? '').trim()) {
        errors.push({ fieldKey: key(field.id), label: `${prefix}${field.label}` });
      }
    }
  });
  return errors;
}

export function formatAssessmentFieldErrors(errors: AssessmentFieldError[]): string {
  return errors.map((error) => error.label).join(', ');
}

export function validateAssessmentStepFields(
  stepNum: number,
  data: AssessmentFormState,
): AssessmentStepValidationResult {
  const errors: AssessmentFieldError[] = [];

  if (stepNum === 1) {
    const requiredFields: { key: string; label: string }[] = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'mrn', label: 'ID / MRN' },
      { key: 'contactPhone', label: 'Contact Phone' },
      { key: 'placeOfLiving', label: 'Place of Living' },
      { key: 'referredBy', label: 'Referred By' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
    ];
    for (const { key, label } of requiredFields) {
      pushMissing(errors, key, label, !isNonEmpty(assessmentField(data, key)));
    }
    pushMissing(errors, 'sex', 'Sex', !isNonEmpty(data?.sex));
    pushMissing(errors, 'smokingStatus', 'Smoking Status', !isNonEmpty(data?.smokingStatus));

    const needsSmokingDetails =
      data?.smokingStatus === 'Current smoker' ||
      data?.smokingStatus === 'Ex smoker' ||
      data?.smokingStatus === 'Current' ||
      data?.smokingStatus === 'Former';
    if (needsSmokingDetails) {
      pushMissing(errors, 'smokingDetails', 'Smoking amount', !isNonEmpty(data?.smokingDetails));
    }

    const caRaw = assessmentField(data, 'currentAge');
    const caNum = typeof caRaw === 'number' ? caRaw : typeof caRaw === 'string' ? Number(caRaw) : NaN;
    if (!Number.isFinite(caNum)) {
      errors.push({ fieldKey: 'currentAge', label: 'Current Age' });
    }

    const email = String(data?.email ?? '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ fieldKey: 'email', label: 'Please enter a valid email address.' });
    }
  }

  if (stepNum === 2) {
    pushMissing(errors, 'primaryDiagnosis', 'Primary Diagnosis', !isNonEmpty(data?.primaryDiagnosis));

    const adRaw = assessmentField(data, 'ageAtDiagnosis');
    const adNum = typeof adRaw === 'number' ? adRaw : typeof adRaw === 'string' ? Number(adRaw) : NaN;
    if (!Number.isFinite(adNum)) {
      errors.push({ fieldKey: 'ageAtDiagnosis', label: 'Age at Diagnosis' });
    }

    pushMissing(errors, 'diseaseDuration', 'Disease Duration', !isNonEmpty(data?.diseaseDuration));
    errors.push(
      ...montrealValidationFieldErrors(data?.primaryDiagnosis, {
        montrealAgeAtDiagnosis: data?.montrealAgeAtDiagnosis,
        ucExtent: data?.ucExtent,
        diseaseLocation: data?.diseaseLocation,
        diseaseBehavior: data?.diseaseBehavior,
        perianalDisease: data?.perianalDisease,
      }).map((error) => ({ fieldKey: String(error.fieldKey), label: error.label })),
    );

    if (parseStringArray(data?.previousSurgeries).length === 0) {
      errors.push({ fieldKey: 'previousSurgeries', label: 'Previous IBD Surgeries' });
    }

    if (data?.primaryDiagnosis === 'Ulcerative Colitis') {
      const ucScoring = normalizeUcEndoscopicScoring(parseUcEndoscopicScoring(data.ucEndoscopicScoring));
      if (isFutureIsoDate(ucScoring.scoringDate ?? '')) {
        errors.push({
          fieldKey: 'ucEndoscopicScoring.scoringDate',
          label: 'UC Endoscopic Scoring date cannot be in the future',
        });
      }
      const pMayo = normalizePartialMayoScore(parsePartialMayoScore(data.partialMayoScoring));
      if (isFutureIsoDate(pMayo.assessmentDate ?? '')) {
        errors.push({
          fieldKey: 'partialMayoScoring.assessmentDate',
          label: 'Partial Mayo Score assessment date cannot be in the future',
        });
      }
    }

    if (data?.primaryDiagnosis === "Crohn's Disease") {
      const sesScoring = normalizeSesCdScoring(parseSesCdScoring(data.sesCdScoring));
      if (isFutureIsoDate(sesScoring.scoringDate ?? '')) {
        errors.push({
          fieldKey: 'sesCdScoring.scoringDate',
          label: 'SES-CD Scoring date cannot be in the future',
        });
      }
      const hbi = normalizeHarveyBradshawIndex(parseHarveyBradshawIndex(data.hbiScoring));
      if (isFutureIsoDate(hbi.assessmentDate ?? '')) {
        errors.push({
          fieldKey: 'hbiScoring.assessmentDate',
          label: 'Harvey-Bradshaw Index assessment date cannot be in the future',
        });
      }
    }
  }

  if (stepNum === 3) {
    pushMissing(
      errors,
      'currentDiseaseActivity',
      'Current Disease Activity Level',
      !String(assessmentField(data, 'currentDiseaseActivity') ?? '').trim(),
    );
    pushMissing(
      errors,
      'stoolFrequency',
      'Frequency of Stools (per day)',
      !String(assessmentField(data, 'stoolFrequency') ?? '').trim(),
    );
  }

  if (stepNum === 4) {
    const inv = parseIbdInvestigations(data.ibdInvestigations, data.dateMostRecentLabs);
    if (inv.sets.length === 0) {
      errors.push({
        fieldKey: 'ibdInvestigations.0.assessmentDate',
        label: 'At least one Laboratory & Investigations section is required',
      });
    } else {
      inv.sets.forEach((set, index) => {
        if (!String(set.assessmentDate ?? '').trim()) {
          errors.push({
            fieldKey: `ibdInvestigations.${index}.assessmentDate`,
            label: `Date of Assessment (set ${index + 1})`,
          });
        }
      });
    }
  }

  if (stepNum === 6) {
    if (!String(assessmentField(data, 'responseToTreatment') ?? '').trim()) {
      errors.push({
        fieldKey: 'responseToTreatment',
        label: 'Response to Current Treatment* (Based on HBI or Partial Mayo scores)',
      });
    }
  }

  if (stepNum === 8) {
    const screening = parseInfectionScreening((data as Record<string, unknown>).infectionScreening);

    for (const [index, set] of screening.sets.entries()) {
      if (set.screeningDate.trim() && isFutureIsoDate(set.screeningDate)) {
        errors.push({
          fieldKey: `infectionScreening.${index}.screeningDate`,
          label: 'Screening date cannot be in the future',
        });
      }
    }

    errors.push(...infectionScreeningFieldErrors(screening));

    if (parseStringArray(data?.comorbidities).length === 0) {
      errors.push({ fieldKey: 'comorbidities', label: 'Comorbidities' });
    }

    let eim: unknown[] = [];
    const eimRaw = data?.extraintestinalManif;
    if (Array.isArray(eimRaw)) eim = eimRaw;
    else if (typeof eimRaw === 'string') {
      const trimmed = eimRaw.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) eim = parsed;
        } catch {
          /* ignore */
        }
      } else if (trimmed) {
        eim = [trimmed];
      }
    }
    if (eim.length === 0) {
      errors.push({ fieldKey: 'extraintestinalManif', label: 'Extraintestinal Manifestations' });
    }

    pushMissing(
      errors,
      'pregnancyPlanning',
      'Pregnancy / Family Planning Status',
      !isNonEmpty(data?.pregnancyPlanning),
    );
  }

  return { errors };
}
