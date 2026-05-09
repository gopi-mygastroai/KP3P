import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new NextResponse(null, { status: 200, headers });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const newPatient = await prisma.patient.create({
      data: patientCreateDataFromBody(body),
    });

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');

    return NextResponse.json({ success: true, patientId: newPatient.id }, { status: 200, headers });
  } catch (error: any) {
    console.error('Submission error:', error);
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    return NextResponse.json({ error: 'Failed to submit form: ' + error.message }, { status: 500, headers });
  }
}
