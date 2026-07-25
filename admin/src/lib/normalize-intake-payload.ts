/**
 * Maps Patient-intake-form JSON to fields understood by patientCreateDataFromBody.
 * Strips legacy/unknown columns so old DB fields are never sent to Supabase.
 */
export function normalizePatientIntakePayload(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const b: Record<string, unknown> = { ...raw };

  if (b.mmrVaricella != null && b.mmr == null) {
    b.mmr = b.mmrVaricella;
    b.varicella = b.mmrVaricella;
  }

  if (
    typeof b.currentIbdMedications === 'string' &&
    b.currentIbdMedications.trim() &&
    b.currentIbdMedicationsRows == null
  ) {
    b.currentIbdMedicationsRows = {
      rows: [
        {
          drugName: 'Other',
          otherDrugSpecify: b.currentIbdMedications.trim(),
          dose: '',
          doseUnit: '',
          startDate: '',
          endDate: '',
          ongoing: true,
          reasonForStopping: '',
        },
      ],
    };
  }

  if (Array.isArray(b.previousTreatmentsTried) && b.previousTreatmentsTried.length > 0) {
    const failed = typeof b.failedTreatments === 'string' ? b.failedTreatments.trim() : '';
    if (!failed) {
      b.failedTreatments = (b.previousTreatmentsTried as string[]).join(', ');
    }
  }

  const legacyKeys = [
    'dateMostRecentColono',
    'dateMostRecentColonoscopy',
    'mmrVaricella',
    'currentIbdMedications',
    'previousTreatmentsTried',
    'tdmResults',
    'steroidUse',
    'currentSupplements',
  ];
  for (const key of legacyKeys) {
    delete b[key];
  }

  return b;
}
