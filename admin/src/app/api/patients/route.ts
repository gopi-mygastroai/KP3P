import { NextRequest, NextResponse } from 'next/server';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';
import { getErrorMessage } from '@/lib/get-error-message';
import {
  createPatient,
  DUPLICATE_PATIENT_INTAKE_MESSAGE,
  findPatientByEmailAndContactPhone,
} from '@/lib/patient-repository';
import { normalizePatientIntakePayload } from '@/lib/normalize-intake-payload';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Mirrors the intake form's client-side rules (Patient-intake-form/src/lib/formSchema.ts). */
function validationErrorFor(name: string, email: string, contactPhone: string): string | null {
  if (!name || !email || !contactPhone) {
    return 'Full name, email, and phone number are required.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address.';
  }
  if (!/^[6-9]\d{9}$/.test(contactPhone)) {
    return 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.';
  }
  return null;
}

function corsHeaders(): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  return headers;
}

export async function OPTIONS(): Promise<NextResponse> {
  const headers = corsHeaders();
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new NextResponse(null, { status: 200, headers });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const headers = corsHeaders();

  try {
    const raw: unknown = await req.json();
    if (!isRecord(raw)) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers });
    }

    const patientData = patientCreateDataFromBody(normalizePatientIntakePayload(raw));
    const name = patientData.name.trim();
    const email = patientData.email.trim();
    const contactPhone = patientData.contactPhone.trim();

    const validationError = validationErrorFor(name, email, contactPhone);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400, headers });
    }

    const existing = await findPatientByEmailAndContactPhone(email, contactPhone);
    if (existing) {
      return NextResponse.json(
        { error: DUPLICATE_PATIENT_INTAKE_MESSAGE },
        { status: 409, headers },
      );
    }

    const newPatient = await createPatient(patientData);

    return NextResponse.json({ success: true, patientId: newPatient.id }, { status: 200, headers });
  } catch (error: unknown) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit form: ' + getErrorMessage(error) },
      { status: 500, headers },
    );
  }
}
