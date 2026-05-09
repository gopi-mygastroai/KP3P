import { prisma } from '@/lib/prisma';
import PatientEditForm from '@/components/PatientEditForm';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function PatientEditPage({ params }: { params: any }) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('userRole');
  
  if (userRole?.value !== 'ADMIN') {
    redirect('/');
  }

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(id, 10) },
    include: { user: true }
  });

  if (!patient) {
    notFound();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <PatientEditForm patient={patient} />
    </div>
  );
}
