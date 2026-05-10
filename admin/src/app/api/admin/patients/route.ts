import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';
import { getErrorMessage } from '@/lib/get-error-message';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('userRole')?.value !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: Record<string, unknown> = {};
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const raw: unknown = await req.json().catch(() => null);
      if (isRecord(raw)) body = raw;
    }

    const newPatient = await prisma.patient.create({
      data: patientCreateDataFromBody(body),
    });

    return NextResponse.json({ success: true, patientId: newPatient.id });
  } catch (error: unknown) {
    console.error('Admin create patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient: ' + getErrorMessage(error) },
      { status: 500 },
    );
  }
}
