import { NextRequest, NextResponse } from 'next/server';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';
import { getErrorMessage } from '@/lib/get-error-message';
import { parseJsonObjectBody } from '@/lib/parse-json-body';
import { updatePatientById } from '@/lib/patient-repository';
import { getAppSession } from '@/lib/auth/session';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getAppSession();
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const patientId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const parsed = await parseJsonObjectBody(request);
    if (!parsed.ok) return parsed.response;

    const payload = patientCreateDataFromBody(parsed.data);

    const updatedPatient = await updatePatientById(patientId, payload);

    return NextResponse.json(updatedPatient);
  } catch (error: unknown) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
