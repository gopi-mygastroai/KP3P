import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';
import { getErrorMessage } from '@/lib/get-error-message';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('userRole');

    if (userRole?.value !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const patientId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const raw: unknown = await request.json();
    if (!isRecord(raw)) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const payload = patientCreateDataFromBody(raw);

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: payload,
    });

    return NextResponse.json(updatedPatient);
  } catch (error: unknown) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
