import { redirect } from 'next/navigation';
import AddPatientBasicForm from './AddPatientBasicForm';
import { getAppSession } from '@/lib/auth/session';

export const metadata = {
  title: 'Add Patient - MyGastro.Ai',
};

export default async function AdminNewPatientPage() {
  const session = await getAppSession();
  if (session.role !== 'ADMIN') {
    redirect('/');
  }

  return <AddPatientBasicForm />;
}
