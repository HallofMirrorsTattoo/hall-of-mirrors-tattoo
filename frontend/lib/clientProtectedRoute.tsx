'use client';

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { useClientAuth } from './clientAuthContext';

export function ClientProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useClientAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    redirect('/client/login');
  }

  return <>{children}</>;
}
