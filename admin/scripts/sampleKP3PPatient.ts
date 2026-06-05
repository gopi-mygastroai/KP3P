import { serializeCurrentIbdMedications, normalizeCurrentIbdMedications } from '../src/lib/current-ibd-medications';
import type { PatientData } from '../src/lib/kp3p-prompt';

/** Representative patient for prompt export / token sizing. */
export function sampleKP3PPatient(): PatientData {
  const medications = normalizeCurrentIbdMedications({ rows: [] });
  const adalimumab = medications.rows.find((r) => r.drugId === 'adalimumab');
  if (adalimumab) {
    adalimumab.currentlyTaking = 'Yes';
    adalimumab.doseMg = '40';
    adalimumab.doseUnit = 'mg';
    adalimumab.frequency = 'Every 2 weeks';
    adalimumab.route = 'Subcutaneous';
    adalimumab.duration = '18 months';
  }
  const azathioprine = medications.rows.find((r) => r.drugId === 'azathioprine');
  if (azathioprine) {
    azathioprine.currentlyTaking = 'Stopped';
    azathioprine.doseMg = '100';
    azathioprine.doseUnit = 'mg';
    azathioprine.frequency = 'Once daily';
    azathioprine.route = 'Oral';
    azathioprine.duration = '6 months';
    azathioprine.reasonForStopping = 'Side effect';
  }

  return {
    name: 'Patient ID 42',
    id: '42',
    age: 45,
    sex: 'Female',
    occupation: 'Teacher',
    location: 'Urban clinic',
    smoking: 'Never',
    diagnosis: "Crohn's disease",
    montreal: 'L2B1',
    severity: 'Moderate',
    duration: '8 years',
    ageAtDx: 37,
    ageAtDiagnosis: 37,
    priorSurgeries: 'None',
    bowelFreq: '4–6/day',
    bloodInStool: 'Occasional',
    abdPain: 'Mild',
    weightLoss: 'No',
    impactOnQoL: 'Moderate',
    activityScore: 'HBI 7',
    hb: '11.2 g/dL',
    tlc: '7.8',
    platelets: '320',
    crp: '18 mg/L',
    albumin: '3.6 g/dL',
    mayoScore: 'N/A',
    currentIbdMedicationsRows: serializeCurrentIbdMedications(medications),
    treatmentResponse: 'Partial response',
    priorFailed: 'Azathioprine intolerance',
    tbStatus: 'Negative',
    hbsAg: 'Negative',
    antiHBs: 'Positive (immune)',
    antiHBc: 'Negative',
    antiHCV: 'Negative',
    antiHIV: 'Negative',
    comorbidities: ['Hypertension'],
    eim: 'None',
    pregnancyPlanning: 'Planning pregnancy in 12 months',
    specialConsiderations: 'Planning pregnancy in 12 months',
    patientLanguage: 'English',
    dateOfBirth: '1980-06-15',
    investigationsDate: '2026-05-01',
    ibdInvestigations: JSON.stringify({
      values: {
        haemoglobin: '11.2',
        crp: '18',
        albumin: '3.6',
        fecalCalprotectin: '420',
      },
    }),
    diseaseLocation: 'L2',
    diseaseBehavior: 'B1',
    vaccineInfluenza: '2024-10',
    vaccineCovid: '2024-03',
    vaccinePneumococcal: '2023',
    vaccineHepB: 'Complete series',
    vaccineHepA: '2022',
    vaccineHepE: 'Unknown',
    vaccineZoster: '2023',
    vaccineTetanus: '2021',
    vaccineMmr: 'Immune',
  };
}
