import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';
import { prisma } from '@/lib/prisma';
import PatientSubmissionsClient, { type PatientRow } from './PatientSubmissionsClient';

export const metadata = {
  title: 'Admin Dashboard - MyGastro.Ai',
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('userRole');
  if (userRole?.value !== 'ADMIN') {
    redirect('/');
  }

  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  const patientRows: PatientRow[] = patients.map((p) => ({
    id: p.id,
    createdAt: p.createdAt.toISOString(),
    name: p.name,
    mrn: p.mrn,
    patientEmail: p.email,
    submitterEmail: p.user?.email ?? null,
    contactPhone: p.contactPhone,
    primaryDiagnosis: p.primaryDiagnosis,
    currentDiseaseActivity: p.currentDiseaseActivity,
    currentAge: p.currentAge,
    assessmentComplete: p.assessmentComplete === true,
  }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .ad-root {
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
        }

        .ad-nav {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 8px 32px;
          min-height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .ad-nav-brand {
          display: flex;
          align-items: center;
        }
        .ad-nav-brand a {
          display: inline-flex;
          align-items: center;
          border-radius: 6px;
          outline: none;
        }
        .ad-nav-brand a:focus-visible {
          box-shadow: 0 0 0 2px #0d9488;
        }
        .ad-nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ad-nav-role {
          font-size: 12px;
          color: #0f766e;
          background: #f0fdfa;
          border: 1px solid #99f6e4;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 600;
        }

        .ad-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 60px;
        }

        .ad-page-heading {
          font-size: clamp(18px, 4vw, 20px);
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .ad-page-sub {
          font-size: 13px;
          color: #475569;
          margin-bottom: 24px;
        }

        .ad-search-wrap {
          margin-bottom: 24px;
          max-width: min(420px, 100%);
        }
        .ad-search-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }
        .ad-search-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ad-search-input::placeholder {
          color: #94a3b8;
        }
        .ad-search-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
        }
        @media (max-width: 768px) {
          .ad-page { padding: 20px 16px 40px; }
          .ad-nav { padding: 8px 16px; }
        }

        .ad-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .ad-card-header {
          padding: 14px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ad-card-header-actions {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        @media (max-width: 640px) {
          .ad-card-header-actions {
            width: 100%;
            justify-content: stretch;
          }
          .ad-card-header-actions button {
            width: 100%;
            justify-content: center;
            min-height: 44px;
          }
        }
        .ad-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        .ad-card-count {
          font-size: 12px;
          color: #475569;
        }

        .ad-table {
          width: 100%;
          border-collapse: collapse;
        }
        .ad-table thead th {
          padding: 10px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }
        .ad-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.1s;
        }
        .ad-table tbody tr:last-child { border-bottom: none; }
        .ad-table tbody tr:hover { background: #f8fafc; }
        .ad-table td {
          padding: 12px 16px;
          font-size: 13px;
          color: #475569;
          vertical-align: middle;
        }

        .td-id { font-size: 12px; color: #334155; }
        .td-date { font-size: 12px; color: #475569; white-space: nowrap; }
        .td-name {
          font-weight: 500;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .td-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 12px;
          font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .td-mrn { font-size: 12px; color: #475569; }
        .td-email { font-size: 12px; color: #475569; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .td-dx { font-size: 13px; color: #334155; font-weight: 500; }
        .td-activity {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 500;
          white-space: nowrap;
        }
        .td-activity-dot { width: 5px; height: 5px; border-radius: 50%; }
        .td-age { font-size: 13px; color: #334155; }
        .td-view a {
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          padding: 5px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          transition: all 0.15s;
          white-space: nowrap;
          display: inline-block;
        }
        .td-view a:hover { background: #f1f5f9; color: #0f172a; }

        .ad-table-wrap { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
        .ad-mobile-patient-list { display: none; }
        .ad-mobile-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          background: #fafafa;
        }
        .ad-mobile-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .ad-mobile-card-name {
          font-weight: 600;
          color: #0f172a;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ad-mobile-card-meta {
          font-size: 12px;
          color: #64748b;
          line-height: 1.45;
        }
        .ad-mobile-card-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }
        .ad-mobile-card-actions a {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          min-height: 44px;
        }
        .ad-mobile-card-actions a.ad-mca-primary {
          background: rgba(13,148,136,0.1);
          border-color: rgba(13,148,136,0.3);
          color: #0d9488;
        }
        @media (max-width: 720px) {
          .ad-table-wrap { display: none; }
          .ad-mobile-patient-list { display: flex; flex-direction: column; gap: 12px; padding: 4px 16px 20px; }
        }

        .ad-empty {
          text-align: center;
          padding: 48px 20px;
          color: #94a3b8;
          font-size: 13px;
        }
      `}</style>

      <div className="ad-root">
        <nav className="ad-nav">
          <div className="ad-nav-brand">
            <Link href="/" aria-label="myGastro.AI home">
              <Image
                src="/mygastro-logo.png"
                alt="myGastro.AI"
                width={210}
                height={38}
                priority
                style={{ width: 'auto', height: 32, objectFit: 'contain' }}
              />
            </Link>
          </div>
          <div className="ad-nav-right">
            <span className="ad-nav-role">Admin</span>
            <LogoutButton />
          </div>
        </nav>

        <div className="ad-page">
          <h1 className="ad-page-heading">Patient Submissions</h1>
          <p className="ad-page-sub">All intake forms submitted by clinicians</p>

          <PatientSubmissionsClient patients={patientRows} />
        </div>
      </div>
    </>
  );
}
