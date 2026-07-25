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
    const email = patientData.email.trim();
    const contactPhone = patientData.contactPhone.trim();

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
