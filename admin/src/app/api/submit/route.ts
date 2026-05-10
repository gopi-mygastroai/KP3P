import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { patientCreateDataFromBody } from '@/lib/patient-create-data';
import { getErrorMessage } from '@/lib/get-error-message';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('userId');

    if (!userIdCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(userIdCookie.value, 10);
    const raw: unknown = await req.json();
    if (!isRecord(raw)) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const created = await prisma.patient.create({
      data: patientCreateDataFromBody(raw),
    });

    const snapshot = {
      ...raw,
      id: created.id,
      userId: Number.isFinite(userId) ? userId : undefined,
      createdAt: created.createdAt.toISOString(),
    };
    const filePath = path.join(process.cwd(), 'submissions.json');
    let submissions: unknown[] = [];
    if (fs.existsSync(filePath)) {
      const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      submissions = Array.isArray(parsed) ? parsed : [];
    }
    submissions.push(snapshot);
    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));

    return NextResponse.json({ success: true, patientId: created.id });
  } catch (error: unknown) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit form: ' + getErrorMessage(error) },
      { status: 500 },
    );
  }
}
