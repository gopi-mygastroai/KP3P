import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { getErrorMessage } from '@/lib/get-error-message';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function strField(r: Record<string, unknown>, key: string, fallback = ''): string {
  const v = r[key];
  return typeof v === 'string' ? v : fallback;
}

function intField(r: Record<string, unknown>, key: string, fallback = 0): number {
  const v = r[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export async function GET(): Promise<NextResponse> {
  try {
    const filePath = path.join(process.cwd(), 'submissions.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: 'No submissions.json found.' });
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(rawData);
    const patients = Array.isArray(parsed) ? parsed : [];

    let migrated = 0;
    for (const entry of patients) {
      if (!isRecord(entry)) continue;
      const patient = entry;
      const id = intField(patient, 'id', 0);
      if (!id) continue;

      const existing = await prisma.patient.findUnique({
        where: { id },
      });

      if (existing) continue;

      const createdAtRaw = patient.createdAt;
      const createdAt =
        typeof createdAtRaw === 'string'
          ? new Date(createdAtRaw)
          : createdAtRaw instanceof Date
            ? createdAtRaw
            : new Date();

      await prisma.patient.create({
        data: {
          id,
          name: strField(patient, 'name'),
          email: strField(patient, 'email').trim(),
          mrn: strField(patient, 'mrn'),
          contactPhone: strField(patient, 'contactPhone'),
          placeOfLiving: strField(patient, 'placeOfLiving'),
          referredBy: strField(patient, 'referredBy'),
          dateOfBirth: strField(patient, 'dateOfBirth'),
          currentAge: intField(patient, 'currentAge'),
          ageAtDiagnosis: intField(patient, 'ageAtDiagnosis'),
          sex: strField(patient, 'sex'),
          smokingStatus: strField(patient, 'smokingStatus'),
          smokingDetails: typeof patient.smokingDetails === 'string' ? patient.smokingDetails : '',
          primaryDiagnosis: strField(patient, 'primaryDiagnosis'),
          diseaseDuration: strField(patient, 'diseaseDuration'),
          perianalDiseaseAssessment: strField(patient, 'perianalDiseaseAssessment'),
          montrealAgeAtDiagnosis: strField(patient, 'montrealAgeAtDiagnosis'),
          ucExtent: strField(patient, 'ucExtent'),
          diseaseLocation: strField(patient, 'diseaseLocation'),
          diseaseBehavior: strField(patient, 'diseaseBehavior'),
          perianalDisease: strField(patient, 'perianalDisease'),
          montrealClass: strField(patient, 'montrealClass'),
          sesCdScoring: strField(patient, 'sesCdScoring') || '{}',
          sesCdClinicalNotes: strField(patient, 'sesCdClinicalNotes'),
          upperGiFindings: strField(patient, 'upperGiFindings') || '{}',
          ucEndoscopicScoring: strField(patient, 'ucEndoscopicScoring') || '{}',
          previousSurgeries: strField(patient, 'previousSurgeries') || '[]',
          currentDiseaseActivity: strField(patient, 'currentDiseaseActivity'),
          stoolFrequency: strField(patient, 'stoolFrequency'),
          bloodInStool: strField(patient, 'bloodInStool'),
          abdominalPain: strField(patient, 'abdominalPain'),
          impactOnQoL: strField(patient, 'impactOnQoL'),
          weightLoss: strField(patient, 'weightLoss'),
          activityScore: strField(patient, 'activityScore'),
          dateMostRecentLabs: strField(patient, 'dateMostRecentLabs'),
          ibdInvestigations: strField(patient, 'ibdInvestigations') || '{}',
          currentIbdMedicationsRows: strField(patient, 'currentIbdMedicationsRows') || '[]',
          failedTreatments: strField(patient, 'failedTreatments'),
          responseToTreatment: strField(patient, 'responseToTreatment'),
          tbScreening: strField(patient, 'tbScreening'),
          hepBSurfaceAg: strField(patient, 'hepBSurfaceAg'),
          hepBSurfaceAb: strField(patient, 'hepBSurfaceAb'),
          hepBCoreAb: strField(patient, 'hepBCoreAb'),
          antiHcv: strField(patient, 'antiHcv'),
          antiHiv: strField(patient, 'antiHiv'),
          influenza: strField(patient, 'influenza'),
          covid19: strField(patient, 'covid19'),
          pneumococcal: strField(patient, 'pneumococcal'),
          hepatitisB: strField(patient, 'hepatitisB'),
          hepatitisA: strField(patient, 'hepatitisA'),
          hepatitisE: strField(patient, 'hepatitisE'),
          zoster: strField(patient, 'zoster'),
          mmr: strField(patient, 'mmr'),
          varicella: strField(patient, 'varicella'),
          tetanusTdap: strField(patient, 'tetanusTdap'),
          comorbidities: strField(patient, 'comorbidities') || '[]',
          extraintestinalManif: strField(patient, 'extraintestinalManif'),
          pregnancyPlanning: strField(patient, 'pregnancyPlanning'),
          preferredLanguage: strField(patient, 'preferredLanguage'),
          occupation: strField(patient, 'occupation'),
          specialConsiderations: strField(patient, 'specialConsiderations'),
          createdAt,
        },
      });
      migrated++;
    }

    return NextResponse.json({ success: true, message: `Migrated ${migrated} patients.` });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
