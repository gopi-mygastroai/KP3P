import { redirect } from 'next/navigation';
import AssessmentWizard from './AssessmentWizard';
import LogoutButton from '../../../LogoutButton';
import { getPatientWithUserById } from '@/lib/patient-repository';
import { getAppSession } from '@/lib/auth/session';

export default async function AdminAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAppSession();
  if (session.role !== 'ADMIN') {
    redirect('/');
  }

  const resolvedParams = await params;

  const patient = await getPatientWithUserById(parseInt(resolvedParams.id));

  if (!patient) {
    return <div className="text-center mt-20 text-white">Patient not found</div>;
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      <AssessmentWizard patient={patient} />
    </div>
  );
}
