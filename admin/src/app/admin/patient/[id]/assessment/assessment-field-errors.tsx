'use client';

import React, { createContext, useContext } from 'react';

const AssessmentFieldErrorsContext = createContext<ReadonlySet<string>>(new Set());

export const FIELD_ERROR_BORDER = '#dc2626';
export const FIELD_ERROR_BG = '#fef2f2';
export const FIELD_ERROR_LABEL = '#dc2626';
export const FIELD_ERROR_RING = '#fecaca';

export function AssessmentFieldErrorsProvider({
  fieldErrors,
  children,
}: {
  fieldErrors: ReadonlySet<string>;
  children: React.ReactNode;
}) {
  return (
    <AssessmentFieldErrorsContext.Provider value={fieldErrors}>
      {children}
    </AssessmentFieldErrorsContext.Provider>
  );
}

export function useAssessmentFieldError(fieldKey: string): boolean {
  const fieldErrors = useContext(AssessmentFieldErrorsContext);
  return fieldKey !== '' && fieldErrors.has(fieldKey);
}

export function fieldBorderColor(hasError: boolean, focused: boolean): string {
  if (hasError) return FIELD_ERROR_BORDER;
  if (focused) return '#0891b2';
  return '#cbd5e1';
}

export function fieldGroupErrorStyle(hasError: boolean): React.CSSProperties {
  if (!hasError) return {};
  return {
    padding: 10,
    borderRadius: 10,
    border: `1px solid ${FIELD_ERROR_RING}`,
    background: FIELD_ERROR_BG,
  };
}

export function infectionScreeningFieldKey(setIndex: number, fieldId: string): string {
  return `infectionScreening.${setIndex}.${fieldId}`;
}

export function ibdInvestigationFieldKey(setIndex: number, fieldId = 'assessmentDate'): string {
  return `ibdInvestigations.${setIndex}.${fieldId}`;
}
