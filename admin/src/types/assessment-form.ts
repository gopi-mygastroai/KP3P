import type { PatientWithUser } from '@/types/patient';

export type { PatientWithUser } from '@/types/patient';

export type AssessmentFormState = Omit<
  PatientWithUser,
  'previousSurgeries' | 'comorbidities' | 'extraintestinalManif'
> & {
  previousSurgeries: string | string[];
  comorbidities: string | string[];
  extraintestinalManif: string | string[];
};

export type AssessmentUpdateFn = (patch: Record<string, unknown>) => void;
