import {
  AdminStep1,
  AdminStep2,
  AdminStep4,
  AdminStep5,
  AdminStep6,
  AdminStep7,
  AdminStep8,
  AdminStep9,
} from '@/app/admin/patient/[id]/assessment/AdminAssessmentSteps';

export const STEP_LABELS = [
  'Basic Info',
  'Disease Characteristics',
  'Symptoms',
  'Investigations',
  'Radiology',
  'Treatment History',
  'Vaccination History',
  'Screening',
] as const;

export const STEP_HEADINGS = [
  'Patient Characteristics',
  'Disease Characteristics',
  'Disease Activity & Symptoms',
  'Laboratory & Investigations',
  'Radiology Investigations',
  'Treatment History',
  'Vaccination History',
  'Comorbidities & Infection Screening',
] as const;

export const STEP_COMPONENTS = [
  AdminStep1,
  AdminStep4,
  AdminStep5,
  AdminStep6,
  AdminStep7,
  AdminStep8,
  AdminStep2,
  AdminStep9,
] as const;

export type SectionConfig = {
  step: number;
  stepLabel: (typeof STEP_LABELS)[number];
  heading: (typeof STEP_HEADINGS)[number];
  Component: (typeof STEP_COMPONENTS)[number];
  compact?: boolean;
};

export const PATIENT_DETAIL_SECTIONS: SectionConfig[] = STEP_LABELS.map((stepLabel, index) => ({
  step: index + 1,
  stepLabel,
  heading: STEP_HEADINGS[index],
  Component: STEP_COMPONENTS[index],
  compact: index === 3 || index === 4,
}));
