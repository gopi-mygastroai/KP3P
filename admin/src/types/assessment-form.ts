import type { Prisma } from '@prisma/client';

export type PatientWithUser = Prisma.PatientGetPayload<{ include: { user: true } }>;

export type AssessmentFormState = Omit<
  PatientWithUser,
  'previousSurgeries' | 'previousTreatmentsTried' | 'comorbidities' | 'documents'
> & {
  previousSurgeries: string | string[];
  previousTreatmentsTried: string | string[];
  comorbidities: string | string[];
  documents: unknown;
};

export type AssessmentUpdateFn = (patch: Record<string, unknown>) => void;
