'use client';

import type { PatientWithUser } from '@/types/assessment-form';
import PatientDetailsView from '@/components/patient-detail/PatientDetailsView';
import PatientDetailsActionBar from '@/components/patient-detail/PatientDetailsActionBar';

type Props = {
  patient: PatientWithUser;
};

export default function PatientDetailsShell({ patient }: Props) {
  return (
    <>
      <style>{`
        .pds-shell {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
          margin-inline: auto;
          overflow-x: hidden;
          padding-inline: clamp(12px, 2vw, 28px);
          padding-bottom: 80px;
        }
        @media (min-width: 1400px) {
          .pds-shell {
            padding-inline: clamp(24px, 3vw, 48px);
          }
        }
        @media (max-width: 860px) {
          .pds-shell { padding-inline: 16px; }
        }
      `}</style>
      <div className="pds-shell">
        <PatientDetailsActionBar patientId={patient.id} />
        <PatientDetailsView patient={patient} />
      </div>
    </>
  );
}
