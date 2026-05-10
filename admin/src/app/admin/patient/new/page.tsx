import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AddPatientBasicForm from './AddPatientBasicForm';

export const metadata = {
  title: 'Add Patient - MyGastro.Ai',
};

export default async function AdminNewPatientPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('userRole')?.value !== 'ADMIN') {
    redirect('/');
  }

  return <AddPatientBasicForm />;
}
