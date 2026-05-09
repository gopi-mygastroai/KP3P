import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'IBD Patient Intake Form — MyGastro.Ai',
  description: 'Securely submit your IBD patient information to MyGastro.Ai',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
