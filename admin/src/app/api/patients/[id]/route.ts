import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PUT(req: Request, context: any) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('userRole');
    if (userRole?.value !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idParam = await context.params;
    const patientId = parseInt(idParam.id, 10);
    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const body = await req.json();

    // Remove protected or relational fields that Prisma cannot directly update this way
    const { id, user, userId, createdAt, updatedAt, ...updateData } = body;

    if (Array.isArray(updateData.documents)) {
      updateData.documents = JSON.stringify(updateData.documents);
    }
    if (Array.isArray(updateData.previousSurgeries)) {
      updateData.previousSurgeries = JSON.stringify(updateData.previousSurgeries);
    }
    if (Array.isArray(updateData.previousTreatmentsTried)) {
      updateData.previousTreatmentsTried = JSON.stringify(updateData.previousTreatmentsTried);
    }
    if (Array.isArray(updateData.comorbidities)) {
      updateData.comorbidities = JSON.stringify(updateData.comorbidities);
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    return NextResponse.json({ success: true, patient: updatedPatient });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update patient: ' + error.message }, { status: 500 });
  }
}
