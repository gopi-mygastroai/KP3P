import { getSupabaseAdminClient } from '@/lib/supabase/server';
import {
  getSupabaseAccessTokenFromCookies,
  getSupabaseRlsClientForServer,
} from '@/lib/supabase/server-auth';
import type {
  PatientInsertInput,
  PatientUpdateInput,
  PatientWithUser,
} from '@/types/patient';

export type AdminPatientRow = {
  id: number;
  createdAt: string;
  name: string;
  mrn: string;
  patientEmail: string;
  submitterEmail: string | null;
  contactPhone: string;
  primaryDiagnosis: string;
  currentDiseaseActivity: string;
  currentAge: number;
  assessmentComplete: boolean;
};

type SupabasePatientRow = {
  id: number;
  userId: number | null;
  createdAt: string;
  name: string;
  mrn: string;
  email: string;
  contactPhone: string;
  primaryDiagnosis: string;
  currentDiseaseActivity: string;
  currentAge: number;
  assessmentComplete: boolean | null;
};

type SupabaseUserRow = {
  id: number;
  email: string;
  name: string;
  role: string;
  password: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatedPatientRecord = {
  id: number;
  createdAt: string;
};

export const DUPLICATE_PATIENT_INTAKE_MESSAGE =
  'This user already exists and your information is already captured. Contact your gastroenterologist for editing or assessment.';

type CreatePatientOptions = {
  authUserId?: string | null;
  appUserId?: number;
};

function toSupabaseRowData(
  data: PatientInsertInput | PatientUpdateInput,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}

async function getSupabaseClientForRequest() {
  const accessToken = await getSupabaseAccessTokenFromCookies();
  return accessToken
    ? getSupabaseRlsClientForServer(accessToken)
    : getSupabaseAdminClient();
}

export async function getAdminPatients(): Promise<AdminPatientRow[]> {
  const supabase = await getSupabaseClientForRequest();

  const { data: patients, error: patientsError } = await supabase
    .from('Patient')
    .select(
      'id,userId,createdAt,name,mrn,email,contactPhone,primaryDiagnosis,currentDiseaseActivity,currentAge,assessmentComplete',
    )
    .order('createdAt', { ascending: false });

  if (patientsError) {
    throw new Error(`Supabase Patient query failed: ${patientsError.message}`);
  }

  const rows = (patients ?? []) as SupabasePatientRow[];
  const userIds = [...new Set(rows.map((r) => r.userId).filter((v): v is number => Number.isFinite(v)))];

  let submitterEmailByUserId = new Map<number, string>();
  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id,email')
      .in('id', userIds);

    if (usersError) {
      throw new Error(`Supabase User query failed: ${usersError.message}`);
    }

    submitterEmailByUserId = new Map(
      (users ?? []).map((u) => [u.id as number, String(u.email ?? '')]),
    );
  }

  return rows.map((p) => ({
    id: p.id,
    createdAt: p.createdAt,
    name: p.name,
    mrn: p.mrn,
    patientEmail: p.email,
    submitterEmail:
      typeof p.userId === 'number'
        ? submitterEmailByUserId.get(p.userId) ?? null
        : null,
    contactPhone: p.contactPhone,
    primaryDiagnosis: p.primaryDiagnosis,
    currentDiseaseActivity: p.currentDiseaseActivity,
    currentAge: p.currentAge,
    assessmentComplete: p.assessmentComplete === true,
  }));
}

function normalizeContactPhoneForMatch(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Case-insensitive email + normalized phone match (intake duplicate check). */
export async function findPatientByEmailAndContactPhone(
  email: string,
  contactPhone: string,
): Promise<{ id: number } | null> {
  const supabase = getSupabaseAdminClient();
  const trimmedEmail = email.trim();
  const normalizedPhone = normalizeContactPhoneForMatch(contactPhone);

  if (!trimmedEmail || normalizedPhone.length !== 10) {
    return null;
  }

  const { data, error } = await supabase
    .from('Patient')
    .select('id,contactPhone')
    .ilike('email', trimmedEmail);

  if (error) {
    throw new Error(`Supabase Patient duplicate lookup failed: ${error.message}`);
  }

  const match = (data ?? []).find(
    (row) =>
      typeof row.contactPhone === 'string' &&
      normalizeContactPhoneForMatch(row.contactPhone) === normalizedPhone,
  );

  return match?.id ? { id: Number(match.id) } : null;
}

export async function createPatient(
  data: PatientInsertInput,
  options?: CreatePatientOptions,
): Promise<CreatedPatientRecord> {
  const supabase = await getSupabaseClientForRequest();
  const payload = toSupabaseRowData(data);
  if (options?.authUserId) payload.authUserId = options.authUserId;
  const appUserId = options?.appUserId;
  if (Number.isFinite(appUserId)) payload.userId = appUserId;
  const nowIso = new Date().toISOString();
  if (!payload.createdAt) {
    payload.createdAt =
      data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : typeof data.createdAt === 'string'
          ? data.createdAt
          : nowIso;
  }
  if (!payload.updatedAt) payload.updatedAt = nowIso;

  const { data: created, error } = await supabase
    .from('Patient')
    .insert(payload)
    .select('id,createdAt')
    .single();

  if (error) {
    throw new Error(`Supabase Patient insert failed: ${error.message}`);
  }

  return {
    id: Number(created?.id),
    createdAt:
      typeof created?.createdAt === 'string'
        ? created.createdAt
        : new Date().toISOString(),
  };
}

export async function updatePatientById(
  patientId: number,
  data: PatientUpdateInput,
): Promise<Record<string, unknown>> {
  const supabase = await getSupabaseClientForRequest();
  const payload = toSupabaseRowData(data);
  if (!payload.updatedAt) payload.updatedAt = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('Patient')
    .update(payload)
    .eq('id', patientId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Supabase Patient update failed: ${error.message}`);
  }

  return (updated ?? {}) as Record<string, unknown>;
}

export async function deletePatientById(patientId: number): Promise<void> {
  const supabase = await getSupabaseClientForRequest();
  const { error } = await supabase.from('Patient').delete().eq('id', patientId);
  if (error) {
    throw new Error(`Supabase Patient delete failed: ${error.message}`);
  }
}

export async function findPatientById(
  patientId: number,
): Promise<{ id: number } | null> {
  const supabase = await getSupabaseClientForRequest();
  const { data, error } = await supabase
    .from('Patient')
    .select('id')
    .eq('id', patientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase Patient lookup failed: ${error.message}`);
  }

  return data?.id ? { id: Number(data.id) } : null;
}

export async function getPatientWithUserById(
  patientId: number,
): Promise<PatientWithUser | null> {
  const supabase = await getSupabaseClientForRequest();

  const { data: patient, error: patientError } = await supabase
    .from('Patient')
    .select('*')
    .eq('id', patientId)
    .maybeSingle();

  if (patientError) {
    throw new Error(`Supabase Patient fetch failed: ${patientError.message}`);
  }
  if (!patient) return null;

  let user: SupabaseUserRow | null = null;
  const userId =
    typeof patient.userId === 'number' ? patient.userId : null;
  if (userId !== null) {
    const { data: userRow, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userError) {
      throw new Error(`Supabase User fetch failed: ${userError.message}`);
    }
    user = (userRow as SupabaseUserRow | null) ?? null;
  }

  return {
    ...patient,
    user,
  } as PatientWithUser;
}
