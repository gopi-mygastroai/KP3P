const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
  const filePath = path.join(__dirname, '..', 'submissions.json');
  if (!fs.existsSync(filePath)) {
    console.log('No submissions.json found. Exiting.');
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const patients = JSON.parse(rawData);

  console.log(`Found ${patients.length} patients to migrate.`);

  let migrated = 0;
  for (const patient of patients) {
    // Check if already exists
    const existing = await prisma.patient.findUnique({
      where: { id: patient.id }
    });

    if (existing) {
      console.log(`Patient ${patient.id} already exists. Skipping.`);
      continue;
    }

    try {
      await prisma.patient.create({
        data: {
          id: patient.id,
          // Extract fields safely
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
      console.log(`Migrated patient ${patient.id}`);
    } catch (error) {
      console.error(`Failed to migrate patient ${patient.id}:`, error);
    }
  }

  console.log(`Migration complete. Migrated ${migrated} out of ${patients.length} patients.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
