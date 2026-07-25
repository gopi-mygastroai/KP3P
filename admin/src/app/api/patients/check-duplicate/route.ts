import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/get-error-message';
import {
  DUPLICATE_PATIENT_INTAKE_MESSAGE,
  findPatientByEmailAndContactPhone,
} from '@/lib/patient-repository';

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

    const email = typeof raw.email === 'string' ? raw.email.trim() : '';
    const contactPhone = typeof raw.contactPhone === 'string' ? raw.contactPhone.trim() : '';

    if (!email || !contactPhone) {
      return NextResponse.json(
        { error: 'Email and phone number are required.' },
        { status: 400, headers },
      );
    }

    const existing = await findPatientByEmailAndContactPhone(email, contactPhone);
    if (existing) {
      return NextResponse.json(
        { error: DUPLICATE_PATIENT_INTAKE_MESSAGE },
        { status: 409, headers },
      );
    }

    return NextResponse.json({ exists: false }, { status: 200, headers });
  } catch (error: unknown) {
    console.error('Duplicate check error:', error);
    return NextResponse.json(
      { error: 'Failed to verify patient details: ' + getErrorMessage(error) },
      { status: 500, headers },
    );
  }
}
