import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('userRole');

    if (userRole?.value !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const patientId = parseInt(resolvedParams.id, 10);
    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const data = await request.json();

    // Same normalization as POST /api/patients — vaccine fields are objects in the admin UI but Prisma stores JSON strings.
    const payload = patientCreateDataFromBody(data as Record<string, unknown>);

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: payload,
    });

    return NextResponse.json(updatedPatient);
  } catch (error: any) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
