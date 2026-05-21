'use client';

import { useEffect } from 'react';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from './clientAuthContext';

export function ClientProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/client/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            border: '2px solid rgba(201,168,76,0.2)',
            borderTopColor: 'var(--gold)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--text-low)',
            margin: 0,
          }}>
            Loading
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
