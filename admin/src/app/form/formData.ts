export const initialFormData = {
  // Step 1
  name: '',
  mrn: '',
  contactPhone: '',
  placeOfLiving: '',
  referredBy: '',
  dateOfBirth: '',
  currentAge: '',
  ageAtDiagnosis: '',
  sex: '',
  smokingStatus: '',
  smokingDetails: '',

  // Step 2
  primaryDiagnosis: '',
  diseaseDuration: '',
  montrealClass: '',
  previousSurgeries: [] as string[],

  // Step 3
  currentDiseaseActivity: '',
  stoolFrequency: '',
  bloodInStool: '',
  abdominalPain: '',
  impactOnQoL: '',
  weightLoss: '',

  // Step 4
  dateMostRecentLabs: '',

  // Step 5
  currentIbdMedications: '',
  failedTreatments: '',
  tdmResults: '',
  currentSupplements: '',
  responseToTreatment: '',
  steroidUse: '',
  previousTreatmentsTried: [] as string[],

  // Step 6
  tbScreening: '',
  hepBSurfaceAg: '',
  hepBSurfaceAb: '',
  hepBCoreAb: '',
  antiHcv: '',
  antiHiv: '',
  influenza: '',
  covid19: '',
  pneumococcal: '',
  hepatitisB: '',
  hepatitisA: '',
  hepatitisE: '',
  zoster: '',
  mmrVaricella: '',
  tetanusTdap: '',

  // Step 7
  comorbidities: [] as string[],
  extraintestinalManif: '',
  pregnancyPlanning: '',
  preferredLanguage: 'English',
  occupation: '',
  specialConsiderations: '',
};

export type FormData = typeof initialFormData;
