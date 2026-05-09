import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('userId');

    if (!userIdCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(userIdCookie.value, 10);
    const body = await req.json();

    const created = await prisma.patient.create({
      data: patientCreateDataFromBody(body),
    });

    const snapshot = {
      ...body,
      id: created.id,
      userId: Number.isFinite(userId) ? userId : undefined,
      createdAt: created.createdAt.toISOString(),
    };
    const filePath = path.join(process.cwd(), 'submissions.json');
    let submissions: unknown[] = [];
    if (fs.existsSync(filePath)) {
      submissions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    submissions.push(snapshot);
    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));

    return NextResponse.json({ success: true, patientId: created.id });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Failed to submit form: ' + error.message }, { status: 500 });
  }
}
