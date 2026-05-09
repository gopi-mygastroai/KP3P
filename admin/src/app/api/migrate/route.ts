import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'submissions.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: 'No submissions.json found.' });
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const patients = JSON.parse(rawData);

    let migrated = 0;
    for (const patient of patients) {
      const existing = await prisma.patient.findUnique({
        where: { id: patient.id }
      });

      if (existing) continue;

      await prisma.patient.create({
        data: {
          id: patient.id,
          name: patient.name || '',
          email: typeof patient.email === 'string' ? patient.email.trim() : '',
          mrn: patient.mrn || '',
          contactPhone: patient.contactPhone || '',
          placeOfLiving: patient.placeOfLiving || '',
          referredBy: patient.referredBy || '',
          dateOfBirth: patient.dateOfBirth || '',
          currentAge: parseInt(patient.currentAge) || 0,
          ageAtDiagnosis: parseInt(patient.ageAtDiagnosis) || 0,
          sex: patient.sex || '',
          smokingStatus: patient.smokingStatus || '',
          smokingDetails: typeof patient.smokingDetails === 'string' ? patient.smokingDetails : '',
          primaryDiagnosis: patient.primaryDiagnosis || '',
          diseaseDuration: patient.diseaseDuration || '',
          perianalDiseaseAssessment: patient.perianalDiseaseAssessment || '',
          montrealClass: patient.montrealClass || '',
          previousSurgeries: patient.previousSurgeries || '[]',
          currentDiseaseActivity: patient.currentDiseaseActivity || '',
          stoolFrequency: patient.stoolFrequency || '',
          bloodInStool: patient.bloodInStool || '',
          abdominalPain: patient.abdominalPain || '',
          impactOnQoL: patient.impactOnQoL || '',
          weightLoss: patient.weightLoss || '',
          dateMostRecentLabs: patient.dateMostRecentLabs || '',
          currentIbdMedications: patient.currentIbdMedications || '',
          failedTreatments: patient.failedTreatments || '',
          tdmResults: patient.tdmResults || '',
          currentSupplements: patient.currentSupplements || '',
          responseToTreatment: patient.responseToTreatment || '',
          steroidUse: patient.steroidUse || '',
          previousTreatmentsTried: patient.previousTreatmentsTried || '[]',
          tbScreening: patient.tbScreening || '',
          hepBSurfaceAg: patient.hepBSurfaceAg || '',
          hepBSurfaceAb: patient.hepBSurfaceAb || '',
          hepBCoreAb: patient.hepBCoreAb || '',
          antiHcv: patient.antiHcv || '',
          antiHiv: patient.antiHiv || '',
          influenza: patient.influenza || '',
          covid19: patient.covid19 || '',
          pneumococcal: patient.pneumococcal || '',
          hepatitisB: patient.hepatitisB || '',
          hepatitisA: patient.hepatitisA || '',
          hepatitisE: patient.hepatitisE || '',
          zoster: patient.zoster || '',
          mmrVaricella: patient.mmrVaricella || '',
          tetanusTdap: patient.tetanusTdap || '',
          comorbidities: patient.comorbidities || '[]',
          extraintestinalManif: patient.extraintestinalManif || '',
          pregnancyPlanning: patient.pregnancyPlanning || '',
          preferredLanguage: patient.preferredLanguage || '',
          occupation: patient.occupation || '',
          specialConsiderations: patient.specialConsiderations || '',
          createdAt: patient.createdAt ? new Date(patient.createdAt) : new Date(),
        }
      });
      migrated++;
    }

    return NextResponse.json({ success: true, message: `Migrated ${migrated} patients.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
