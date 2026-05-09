import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Generate a unique patient ID
    const patientId = `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      ...body,
      patientId,
      submittedAt: new Date().toISOString(),
    };

    // Ensure the data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Read existing patient records
    const filePath = join(dataDir, 'patients.json');
    let patients: any[] = [];

    if (existsSync(filePath)) {
      try {
        const raw = await readFile(filePath, 'utf-8');
        patients = JSON.parse(raw);
      } catch {
        patients = [];
      }
    }

    // Append new record and write back
    patients.push(record);
    await writeFile(filePath, JSON.stringify(patients, null, 2), 'utf-8');

    return NextResponse.json({ success: true, patientId }, { status: 200 });
  } catch (error: any) {
    console.error('[/api/submit] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
