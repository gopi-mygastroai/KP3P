import type { Prisma } from '@prisma/client';

export type PatientWithUser = Prisma.PatientGetPayload<{ include: { user: true } }>;

export type AssessmentFormState = Omit<PatientWithUser, 'previousSurgeries' | 'comorbidities'> & {
  previousSurgeries: string | string[];
  comorbidities: string | string[];
};

export type AssessmentUpdateFn = (patch: Record<string, unknown>) => void;
