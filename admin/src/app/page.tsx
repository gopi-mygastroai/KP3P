import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AuthForm from './AuthForm';

export const metadata = {
  title: 'MyGastro.Ai - Patient Intake',
  description: 'Patient Intake Web App for MyGastro.Ai',
};

export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId');
  const userRole = cookieStore.get('userRole');

  if (userId) {
    if (userRole?.value === 'ADMIN') {
      redirect('/admin');
    } else {
      redirect('/form');
    }
  }

  return (
    <main className="container flex flex-col items-center justify-center min-h-[100dvh] py-6">
      <div className="glass-panel w-full mx-auto" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-6">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <Link href="/" className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded" aria-label="myGastro.AI home">
              <Image
                src="/mygastro-logo.png"
                alt="myGastro.AI"
                width={260}
                height={48}
                priority
                style={{ width: 'auto', height: 42, objectFit: 'contain' }}
              />
            </Link>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            AI-Powered Gastroenterology Platform
          </p>
        </div>
        <AuthForm />
      </div>
      <footer className="mt-8 text-center text-xs" style={{ color: '#475569' }}>
        © 2026{' '}
        <Link href="/" className="underline decoration-slate-400 underline-offset-2 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 rounded">
          myGastro.AI
        </Link>
        . Secure & ABHA Compliant.
      </footer>
    </main>
  );
}
