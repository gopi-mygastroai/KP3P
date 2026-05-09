import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MultiStepForm from './MultiStepForm';
import LogoutButton from '../admin/LogoutButton';

export default async function FormPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId');

  if (!userId) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-50 w-full flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center px-4 py-3 sm:px-6 sm:py-4 border-b"
        style={{ background: 'rgba(5,13,26,0.8)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="font-bold text-lg sm:text-xl tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
            style={{ color: '#f8fafc' }}
            aria-label="myGastro.AI home"
          >
            myGastro<span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>.AI</span>
          </Link>
          <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ background: 'var(--primary-color)', color: '#fff' }}>
            Patient Portal
          </span>
        </div>
        <div className="flex w-full justify-end sm:w-auto">
          <LogoutButton />
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center py-6 sm:py-10 px-3 sm:px-4 w-full max-w-[1000px] mx-auto">
        <div className="w-full max-w-3xl">
          <MultiStepForm />
        </div>
      </main>
    </div>
  );
}
