import type { PatientWithUser } from '@/types/assessment-form';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';

/** In-memory placeholder for “add patient” basic form before a DB row exists. */
export function seedEmptyPatientForAdminForm(): PatientWithUser {
  const now = new Date();
  const data = patientCreateDataFromBody({});
  return {
    ...data,
    id: 0,
    userId: null,
    user: null,
    createdAt: now,
    updatedAt: now,
  } as PatientWithUser;
}
