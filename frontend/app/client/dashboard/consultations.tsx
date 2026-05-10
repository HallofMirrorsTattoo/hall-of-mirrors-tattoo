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
          <h3 className="text-lg font-serif font-bold text-primary-dark mb-6">
            Request a Consultation
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-dark/80 mb-2">
                Tell Robyn about your tattoo ideas
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the design, style, size, and placement you have in mind..."
                rows={4}
                className="w-full bg-white border border-primary-dark/10 rounded-lg px-4 py-3 text-primary-dark placeholder-primary-dark/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
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
      {error && <p className="text-red-600">{error}</p>}

      {consultations.length === 0 ? (
        <div className="text-center py-12 text-primary-dark/70">
          <p>No consultations yet. Submit your ideas above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <div key={consultation.consultation_id} className="card-premium">
              <div className="card-premium-inner">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-serif font-bold text-primary-dark">
                    {consultation.artist_name || 'Robyn'}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    consultation.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {consultation.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-primary-dark/60 mb-1">Your message:</p>
                    <p className="text-primary-dark/80">{consultation.message}</p>
                  </div>

                  {consultation.artist_response && (
                    <div className="pt-4 border-t border-accent-gold/30 bg-accent-gold/5 p-4 rounded-lg">
                      <p className="text-xs text-primary-dark/60 mb-2">Robyn's response:</p>
                      <p className="text-primary-dark/80">{consultation.artist_response}</p>
                    </div>
                  )}

                  <p className="text-xs text-primary-dark/50">
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
