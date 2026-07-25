import { NextRequest, NextResponse } from 'next/server';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';
import { getErrorMessage } from '@/lib/get-error-message';
import { parseJsonObjectBody } from '@/lib/parse-json-body';
import { deletePatientById, updatePatientById } from '@/lib/patient-repository';
import { getAppSession } from '@/lib/auth/session';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getAppSession();
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idParam = await context.params;
    const patientId = parseInt(idParam.id, 10);
    if (Number.isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const parsed = await parseJsonObjectBody(req);
    if (!parsed.ok) return parsed.response;

    const payload = patientCreateDataFromBody(parsed.data);

    const updatedPatient = await updatePatientById(patientId, payload);

    return NextResponse.json({ success: true, patient: updatedPatient });
  } catch (error: unknown) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update patient: ' + getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getAppSession();
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idParam = await context.params;
    const patientId = parseInt(idParam.id, 10);
    if (Number.isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    await deletePatientById(patientId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient: ' + getErrorMessage(error) },
      { status: 500 },
    );
  }
}
