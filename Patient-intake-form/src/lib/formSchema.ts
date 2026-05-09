// ─── Vaccination Types ────────────────────────────────────────────────────────
export type VaccineDose = { date: string; dosage: string };
export type VaccineEntry = {
  status: 'given' | 'never' | 'unknown' | '';
  doses: VaccineDose[];
};

const emptyVaccine = (): VaccineEntry => ({ status: '', doses: [] });

// ─── Full Form Data Type ──────────────────────────────────────────────────────
export type FormData = {
  email: string; name: string; mrn: string; dateOfBirth: string;
  currentAge: string; ageAtDiagnosis: string; sex: string;
  smokingStatus: string; smokingDetails: string; contactPhone: string;
  placeOfLiving: string; referredBy: string;
  primaryDiagnosis: string; montrealClass: string; diseaseDuration: string;
  previousSurgeries: string[]; perianalDiseaseAssessment: string;
  currentDiseaseActivity: string; activityScore: string; stoolFrequency: string;
  bloodInStool: string; abdominalPain: string; impactOnQoL: string; weightLoss: string;
  currentIbdMedications: string; responseToTreatment: string; tdmResults: string;
  steroidUse: string; currentSupplements: string;
  previousTreatmentsTried: string[]; failedTreatments: string;
  tbScreening: string; hepBSurfaceAg: string; hepBSurfaceAb: string;
  hepBCoreAb: string; antiHcv: string; antiHiv: string;
  influenza: VaccineEntry;
  covid19: VaccineEntry;
  pneumococcal: VaccineEntry;
  hepatitisB: VaccineEntry;
  hepatitisA: VaccineEntry;
  hepatitisE: VaccineEntry;
  zoster: VaccineEntry;
  mmrVaricella: VaccineEntry;
  tetanusTdap: VaccineEntry;
  comorbidities: string[]; extraintestinalManif: string[];
  pregnancyPlanning: string; occupation: string;
  specialConsiderations: string; preferredLanguage: string;
};

export const initialFormData: FormData = {
  email: '', name: '', mrn: '', dateOfBirth: '', currentAge: '',
  ageAtDiagnosis: '', sex: '', smokingStatus: '', smokingDetails: '',
  contactPhone: '', placeOfLiving: '', referredBy: '',
  primaryDiagnosis: '', montrealClass: '', diseaseDuration: '',
  previousSurgeries: [], perianalDiseaseAssessment: '',
  currentDiseaseActivity: '', activityScore: '', stoolFrequency: '',
  bloodInStool: '', abdominalPain: '', impactOnQoL: '', weightLoss: '',
  currentIbdMedications: '', responseToTreatment: '', tdmResults: '',
  steroidUse: '', currentSupplements: '',
  previousTreatmentsTried: [], failedTreatments: '',
  tbScreening: '', hepBSurfaceAg: '', hepBSurfaceAb: '',
  hepBCoreAb: '', antiHcv: '', antiHiv: '',
  influenza:    emptyVaccine(),
  covid19:      emptyVaccine(),
  pneumococcal: emptyVaccine(),
  hepatitisB:   emptyVaccine(),
  hepatitisA:   emptyVaccine(),
  hepatitisE:   emptyVaccine(),
  zoster:       emptyVaccine(),
  mmrVaricella: emptyVaccine(),
  tetanusTdap:  emptyVaccine(),
  comorbidities: [], extraintestinalManif: [], pregnancyPlanning: '',
  occupation: '', specialConsiderations: '', preferredLanguage: '',
};

export const STEP_META = [
  { title: 'Patient Characteristics',     sub: 'Personal and demographic information' },
  { title: 'Medical Profile',             sub: 'Health information and vaccination history' },
];

const VAX_FIELDS: (keyof FormData)[] = [
  'influenza','covid19','pneumococcal','hepatitisB',
  'hepatitisA','hepatitisE','zoster','mmrVaricella','tetanusTdap',
];

const VAX_LABELS: Record<string, string> = {
  influenza:    'Influenza vaccine',
  covid19:      'COVID-19 vaccine',
  pneumococcal: 'Pneumococcal vaccine',
  hepatitisB:   'Hepatitis B vaccine',
  hepatitisA:   'Hepatitis A vaccine',
  hepatitisE:   'Hepatitis E vaccine',
  zoster:       'Zoster vaccine',
  mmrVaricella: 'MMR / Varicella',
  tetanusTdap:  'Tetanus / Tdap',
};

export function validateStep(step: number, d: FormData): Record<string, string> {
  const err: Record<string, string> = {};
  const todayStr = new Date().toISOString().split('T')[0];

  const req = (f: keyof FormData, label: string) => {
    const v = d[f];
    if (!v || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0))
      err[f as string] = `${label} is required`;
  };

  if (step === 1) {
    req('email','Email'); req('name','Patient full name');
    req('dateOfBirth','Date of birth'); req('currentAge','Current age');
    req('ageAtDiagnosis','Age at IBD diagnosis'); req('sex','Sex');
    req('smokingStatus','Smoking status'); req('contactPhone','Contact phone');
    req('placeOfLiving','Place of living'); req('referredBy','Referred by');
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
      err['email'] = 'Enter a valid email address';
    if (d.contactPhone && !/^[6-9]\d{9}$/.test(d.contactPhone))
      err['contactPhone'] = 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9';
      
    if (d.name && !/^[a-zA-Z\s.'-]+$/.test(d.name))
      err['name'] = 'Name cannot contain special characters (only letters, spaces, hyphens, and apostrophes allowed)';

    if (d.referredBy && !/^[a-zA-Z\s.'-]+$/.test(d.referredBy))
      err['referredBy'] = 'Referred By cannot contain special characters';

    if (d.placeOfLiving && !/^[a-zA-Z\s.'-,]+$/.test(d.placeOfLiving))
      err['placeOfLiving'] = 'Place of Living cannot contain special characters';

    if (d.mrn && !/^[a-zA-Z0-9-]+$/.test(d.mrn))
      err['mrn'] = 'Patient ID / MRN / ABHA ID can only contain letters, numbers, and hyphens';

    if (d.dateOfBirth && d.dateOfBirth > todayStr)
      err['dateOfBirth'] = 'Date of birth cannot be a future date';

    if (d.currentAge && d.ageAtDiagnosis) {
      if (Number(d.ageAtDiagnosis) > Number(d.currentAge)) {
        err['ageAtDiagnosis'] = 'Age at IBD diagnosis cannot be greater than current age';
      }
    }
  }
  if (step === 2) { 
    req('primaryDiagnosis','Primary diagnosis'); 
    req('diseaseDuration','Disease duration'); 
    
    // Vaccination validation
    VAX_FIELDS.forEach(f => {
      const entry = d[f] as VaccineEntry;
      if (entry && entry.status === 'given') {
        entry.doses.forEach((dose) => {
          if (dose.date && dose.date > todayStr) {
            err[f as string] = `${VAX_LABELS[f as string]} date cannot be a future date`;
          }
          if (dose.dosage && !/[a-zA-Z]/.test(dose.dosage)) {
            err[f as string] = `Dosage for ${VAX_LABELS[f as string]} requires a measurement unit (e.g., mL, mg)`;
          }
        });
      }
    });
  }
  return err;
}
