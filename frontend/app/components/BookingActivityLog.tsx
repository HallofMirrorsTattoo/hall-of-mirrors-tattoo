'use client';

import { useEffect, useState, useCallback } from 'react';

interface ActivityEntry {
  id: string;
  actor_type: 'artist' | 'client' | 'system';
  action: string;
  original_date: string | null;
  original_time: string | null;
  proposed_date: string | null;
  proposed_time: string | null;
  note: string | null;
  created_at: string;
}

interface Props {
  bookingId?: string; // kept for readability; the endpoint already encodes the booking ID
  accessToken: string;
  endpoint: string; // full URL e.g. /api/client/bookings/:id/activity
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(`${d.substring(0, 10)}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function fmtTime(t: string | null): string {
  if (!t) return '';
  const h = parseInt(t.substring(0, 2), 10);
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

function actionLabel(action: string, actorType: string): string {
  const who = actorType === 'artist' ? 'Artist' : actorType === 'client' ? 'Client' : 'System';
  switch (action) {
    case 'booking_created': return 'Booking submitted';
    case 'booking_confirmed': return `${who} confirmed the booking`;
    case 'booking_cancelled': return `${who} cancelled the booking`;
    case 'reschedule_proposed': return `${who} proposed a new date`;
    case 'counter_offer_proposed': return `${who} proposed a new date`;
    case 'counter_offer_accepted': return `${who} accepted the new date`;
    case 'counter_offer_declined': return `${who} declined the proposal`;
    case 'status_changed': return `Status updated by ${who.toLowerCase()}`;
    default: return action.replace(/_/g, ' ');
  }
}

function actionIcon(action: string): string {
  if (action.includes('cancel')) return '✕';
  if (action.includes('confirmed')) return '✓';
  if (action.includes('accepted')) return '✓';
  if (action.includes('declined')) return '✕';
  if (action.includes('reschedule') || action.includes('counter_offer')) return '↔';
  return '·';
}

function actionColor(action: string): string {
  if (action.includes('cancel') || action.includes('declined')) return 'rgba(239,68,68,0.8)';
  if (action.includes('confirmed') || action.includes('accepted')) return 'rgba(34,197,94,0.8)';
  if (action.includes('reschedule') || action.includes('counter_offer')) return 'var(--gold)';
  return 'var(--text-mid)';
}

export default function BookingActivityLog({ accessToken, endpoint }: Props) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivity(data.activity || []);
      }
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  }, [endpoint, accessToken]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[1, 2].map(i => (
        <div key={i} className="skeleton" style={{ height: '2.5rem', borderRadius: '0.375rem' }} />
      ))}
    </div>
  );

  if (activity.length === 0) return (
    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', margin: 0, fontStyle: 'italic' }}>
      No activity recorded yet.
    </p>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Vertical timeline line */}
      <div style={{ position: 'absolute', left: '0.5rem', top: '1rem', bottom: '0.5rem', width: '1px', background: 'rgba(201,168,76,0.12)' }} />

      {activity.map((entry, i) => {
        const hasDateChange = entry.original_date || entry.proposed_date;
        const color = actionColor(entry.action);
        const icon = actionIcon(entry.action);
        const isLast = i === activity.length - 1;

        return (
          <div key={entry.id} style={{ display: 'flex', gap: '0.875rem', paddingBottom: isLast ? 0 : '1rem', position: 'relative' }}>
            {/* Icon dot */}
            <div style={{
              flexShrink: 0,
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              background: 'var(--bg)',
              border: `1.5px solid ${color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.5rem',
              color,
              marginTop: '0.1rem',
              zIndex: 1,
            }}>
              {icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Action label + timestamp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginBottom: hasDateChange ? '0.375rem' : 0 }}>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--cream)', margin: 0, fontWeight: 500 }}>
                  {actionLabel(entry.action, entry.actor_type)}
                </p>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.06em', color: 'var(--text-low)', flexShrink: 0 }}>
                  {new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {' · '}
                  {new Date(entry.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Date change: original → proposed */}
              {hasDateChange && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: entry.note ? '0.375rem' : 0 }}>
                  {entry.original_date && (
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'var(--text-low)', textDecoration: 'line-through' }}>
                      {fmtDate(entry.original_date)}{entry.original_time ? ` ${fmtTime(entry.original_time)}` : ''}
                    </span>
                  )}
                  {entry.original_date && entry.proposed_date && (
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: 'var(--text-low)' }}>→</span>
                  )}
                  {entry.proposed_date && (
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color }}>
                      {fmtDate(entry.proposed_date)}{entry.proposed_time ? ` ${fmtTime(entry.proposed_time)}` : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Note */}
              {entry.note && (
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.7875rem', color: 'var(--text-mid)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                  &ldquo;{entry.note}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
