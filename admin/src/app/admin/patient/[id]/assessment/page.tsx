import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AssessmentWizard from './AssessmentWizard';
import LogoutButton from '../../../LogoutButton';

export default async function AdminAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('userRole');

  if (userRole?.value !== 'ADMIN') {
    redirect('/');
  }

  const resolvedParams = await params;

  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(resolvedParams.id) },
    include: { user: true },
  });

  if (!patient) {
    return <div className="text-center mt-20 text-white">Patient not found</div>;
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      <AssessmentWizard patient={patient} />
    </div>
  );
}
