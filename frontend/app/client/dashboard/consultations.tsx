'use client';

import { useEffect, useState } from 'react';
import { useClientAuth } from '@/lib/clientAuthContext';

interface Consultation {
  consultation_id: string;
  artist_id: string;
  artist_name: string;
  message: string;
  status: string;
  artist_response: string | null;
  created_at: string;
}

export default function ConsultationsTab() {
  const { accessToken } = useClientAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/consultations`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch consultations');

        const data = await response.json();
        setConsultations(data.consultations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load consultations');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchConsultations();
    }
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/consultations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            artist_id: 'artist-robyn-001',
            message: message,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to submit consultation request');

      const data = await response.json();
      setConsultations([data.consultation, ...consultations]);
      setMessage('');
      alert('Consultation request sent! Robyn will respond soon.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading your consultations...</p>;

  return (
    <div className="space-y-8">
      {/* Request Form */}
      <div className="card-premium">
        <div className="card-premium-inner">
          <h3 className="text-lg font-serif font-bold mb-6" style={{ color: 'var(--cream)' }}>
            Request a Consultation
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="consultation-message">Tell Robyn about your tattoo ideas</label>
              <textarea
                id="consultation-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the design, style, size, and placement you have in mind..."
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Request Consultation'}
            </button>
          </form>
        </div>
      </div>

      {/* Consultations List */}
      {error && <p style={{ color: '#fca5a5', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem' }}>{error}</p>}

      {consultations.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-mid)' }}>
          <p>No consultations yet. Submit your ideas above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <div key={consultation.consultation_id} className="card-premium">
              <div className="card-premium-inner">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-serif font-bold" style={{ color: 'var(--cream)' }}>
                    {consultation.artist_name || 'Robyn'}
                  </h4>
                  <span style={{
                    ...(consultation.status === 'pending'
                      ? { background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.7)', border: '1px solid rgba(201,168,76,0.18)' }
                      : { background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)' }),
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '0.625rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                  }}>
                    {consultation.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-low)' }}>Your message:</p>
                    <p style={{ color: 'var(--text)' }}>{consultation.message}</p>
                  </div>

                  {consultation.artist_response && (
                    <div className="pt-4 p-4 rounded-lg" style={{ borderTop: '1px solid rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.04)' }}>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-low)' }}>Robyn&apos;s response:</p>
                      <p style={{ color: 'var(--text)' }}>{consultation.artist_response}</p>
                    </div>
                  )}

                  <p className="text-xs" style={{ color: 'var(--text-low)' }}>
                    {new Date(consultation.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
