import PatientEditForm from '@/components/PatientEditForm';
import { notFound, redirect } from 'next/navigation';
import { getPatientWithUserById } from '@/lib/patient-repository';
import { getAppSession } from '@/lib/auth/session';

export default async function PatientEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAppSession();
  if (session.role !== 'ADMIN') {
    redirect('/');
  }

  const { id } = await params;
  const patient = await getPatientWithUserById(parseInt(id, 10));

  if (!patient) {
    notFound();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <PatientEditForm patient={patient} />
    </div>
  );
}
