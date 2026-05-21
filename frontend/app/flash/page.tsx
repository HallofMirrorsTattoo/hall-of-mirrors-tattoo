'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hall-of-mirrors-tattoo-production.up.railway.app';

interface FlashSlot {
  id: string;
  title: string;
  price_pence: number;
  image_url: string | null;
  is_available: boolean;
  claimed_by_name: string | null;
}

interface FlashDay {
  id: string;
  event_date: string;
  title: string;
  description: string | null;
  artist_name: string;
  slots: FlashSlot[];
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    long: new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d),
    short: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(d),
    dayOfWeek: new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(d),
    dayNum: new Intl.DateTimeFormat('en-GB', { day: 'numeric' }).format(d),
    month: new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(d),
    year: new Intl.DateTimeFormat('en-GB', { year: 'numeric' }).format(d),
  };
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(dateStr + 'T12:00:00');
  event.setHours(0, 0, 0, 0);
  return Math.round((event.getTime() - today.getTime()) / 86400000);
}

// ── Claim modal ───────────────────────────────────────────────────────────────

function ClaimModal({
  slot,
  dayTitle,
  onClose,
  onSuccess,
}: {
  slot: FlashSlot;
  dayTitle: string;
  onClose: () => void;
  onSuccess: (slotId: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/flash/${slot.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim');
      setDone(true);
      setTimeout(() => { onSuccess(slot.id); onClose(); }, 2400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(14,12,9,0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
        borderRadius: '0.375rem',
        padding: '2.5rem',
        maxWidth: '480px',
        width: '100%',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-low)', fontSize: '1.125rem', lineHeight: 1, padding: '0.25rem',
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '2rem', fontWeight: 300, color: 'var(--gold)', marginBottom: '0.75rem' }}>
              Claimed.
            </div>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--text-mid)', lineHeight: 1.7 }}>
              Check your inbox — we&apos;ll be in touch to confirm your appointment.
            </p>
          </div>
        ) : (
          <>
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Claim this design</p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              color: 'var(--cream)', letterSpacing: '-0.02em',
              lineHeight: 1.05, marginBottom: '0.375rem',
            }}>
              {slot.title}
            </h2>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: '1.75rem' }}>
              £{Math.round(slot.price_pence / 100)} · {dayTitle}
            </p>

            <form onSubmit={handleSubmit}>
              {[
                { label: 'Your name', value: name, onChange: setName, type: 'text', required: true, placeholder: 'e.g. Sarah Thompson' },
                { label: 'Email address', value: email, onChange: setEmail, type: 'email', required: true, placeholder: 'you@example.com' },
                { label: 'Phone (optional)', value: phone, onChange: setPhone, type: 'tel', required: false, placeholder: '+44 7700 000000' },
              ].map(({ label, value, onChange, type, required, placeholder }) => (
                <div key={label} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '0.4rem' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    required={required}
                    placeholder={placeholder}
                    style={{
                      width: '100%', padding: '0.75rem 1rem',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: '0.25rem', color: 'var(--cream)',
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem',
                      outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.4)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                </div>
              ))}

              {error && (
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', color: '#e57373', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  {error}
                </p>
              )}

              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                By claiming this design you&apos;re reserving it — Robyn will contact you to confirm the appointment date and time.
              </p>

              <button
                type="submit"
                disabled={submitting || !name.trim() || !email.trim()}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
              >
                <span>{submitting ? 'Claiming…' : 'Claim this design'}</span>
                {!submitting && <span className="btn-icon" aria-hidden="true">↗</span>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Slot card ─────────────────────────────────────────────────────────────────

function SlotCard({ slot, onClaim }: { slot: FlashSlot; onClaim: (slot: FlashSlot) => void }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hover && slot.is_available ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
        borderRadius: '0.375rem',
        overflow: 'hidden',
        transition: 'border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease',
        transform: hover && slot.is_available ? 'translateY(-2px)' : 'none',
        boxShadow: hover && slot.is_available ? '0 12px 40px rgba(201,168,76,0.08)' : 'none',
        display: 'flex',
        flexDirection: 'column' as const,
      }}
    >
      {/* Image area */}
      <div style={{
        aspectRatio: '1',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {slot.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slot.image_url}
            alt={slot.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: slot.is_available ? 'none' : 'grayscale(60%) brightness(0.5)',
              transition: 'filter 0.3s ease',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)',
          }}>
            <span style={{
              fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
              fontSize: '3.5rem', fontWeight: 300,
              color: slot.is_available ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
              lineHeight: 1,
            }}>
              ◈
            </span>
            <span style={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.58rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--text-low)', marginTop: '0.5rem',
            }}>
              Design preview
            </span>
          </div>
        )}

        {/* Taken overlay */}
        {!slot.is_available && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(14,12,9,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.72rem',
              letterSpacing: '0.25em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '0.35rem 0.875rem',
              borderRadius: '2rem',
            }}>
              Claimed
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '1.125rem 1.25rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', fontWeight: 500, color: 'var(--cream)', margin: '0 0 0.25rem', lineHeight: 1.3 }}>
            {slot.title}
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 300, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
            £{Math.round(slot.price_pence / 100)}
          </p>
        </div>

        {slot.is_available ? (
          <button
            type="button"
            onClick={() => onClaim(slot)}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.625rem 1rem', justifyContent: 'center' }}
          >
            <span>Claim this design</span>
            <span className="btn-icon" aria-hidden="true">↗</span>
          </button>
        ) : (
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: 0 }}>
            {slot.claimed_by_name ? `Claimed by ${slot.claimed_by_name}` : 'Claimed'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FlashPage() {
  const [flashDays, setFlashDays] = useState<FlashDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingSlot, setClaimingSlot] = useState<{ slot: FlashSlot; dayTitle: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/api/flash`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setFlashDays(d.flash_days);
        else setError(d.error || 'Failed to load');
      })
      .catch(() => setError('Could not connect to the server'))
      .finally(() => setLoading(false));
  }, []);

  const handleClaimSuccess = (slotId: string) => {
    setFlashDays(prev => prev.map(day => ({
      ...day,
      slots: day.slots.map(s => s.id === slotId ? { ...s, is_available: false } : s),
    })));
  };

  const rowStyle: React.CSSProperties = {
    fontFamily: '"DM Mono", monospace', fontSize: '0.68rem',
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: 'rgba(201,168,76,0.6)', margin: 0,
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ padding: '7rem 1.5rem 5rem', maxWidth: '64rem', margin: '0 auto' }}>
        <p style={{ ...rowStyle, marginBottom: '1rem' }}>Flash Days</p>
        <h1 style={{
          fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
          fontWeight: 300, fontSize: 'clamp(3.5rem, 9vw, 7rem)',
          color: 'var(--cream)', letterSpacing: '-0.03em', lineHeight: 0.95,
          marginBottom: '2rem',
        }}>
          One day.<br />Original designs.
        </h1>
        <p style={{
          fontFamily: '"DM Sans", sans-serif', fontSize: '1rem',
          color: 'var(--text-mid)', lineHeight: 1.8,
          maxWidth: '48ch', marginBottom: '2.5rem',
        }}>
          A flash day is Robyn turning up with a book full of finished designs — each one a one-of-a-kind piece, priced and ready to go. No waiting on custom work. You see it, you want it, you book it. When it&apos;s gone, it&apos;s gone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/booking" className="btn-secondary">Book a custom session instead</Link>
        </div>
      </section>

      <div className="section-divider"><span>HOM</span></div>

      {/* Flash days */}
      <section style={{ padding: '4rem 1.5rem 8rem', maxWidth: '64rem', margin: '0 auto' }}>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: '0.375rem' }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: '3rem', textAlign: 'center',
            border: '1px solid var(--border)', borderRadius: '0.375rem',
          }}>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', color: 'var(--text-low)', letterSpacing: '0.1em' }}>
              Could not load flash days — please try again later.
            </p>
          </div>
        )}

        {!loading && !error && flashDays.length === 0 && (
          <div style={{
            padding: '5rem 3rem', textAlign: 'center',
            border: '1px solid var(--border)', borderRadius: '0.375rem',
            background: 'var(--surface)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(201,168,76,0.035) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <p style={{
              fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
              fontSize: '2rem', fontWeight: 300, color: 'rgba(201,168,76,0.25)',
              marginBottom: '1rem', lineHeight: 1,
            }}>
              No upcoming flash days
            </p>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)', lineHeight: 1.7, maxWidth: '36ch', margin: '0 auto 2rem' }}>
              Nothing in the diary just yet. Robyn announces flash days on Instagram first —{' '}
              <a href="https://instagram.com/hallofmirrorstattoo" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(201,168,76,0.5)', textDecoration: 'none' }}>follow @hallofmirrorstattoo</a>
              {' '}and you won&apos;t miss the next one.
            </p>
            <Link href="/booking?mode=consultation" className="btn-secondary">
              Request a custom consultation instead
            </Link>
          </div>
        )}

        {!loading && flashDays.map((day, dayIndex) => {
          const date = fmtDate(day.event_date);
          const dtu = daysUntil(day.event_date);
          const countdown = dtu === 0 ? 'Today' : dtu === 1 ? 'Tomorrow' : dtu > 0 ? `In ${dtu} days` : null;
          const totalSlots = day.slots.length;
          const availableSlots = day.slots.filter(s => s.is_available).length;

          return (
            <div key={day.id} style={{ marginBottom: dayIndex < flashDays.length - 1 ? '6rem' : 0 }}>
              {/* Day header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.5rem' }}>
                    <p style={{ ...rowStyle, margin: 0 }}>{date.dayOfWeek} · {date.dayNum} {date.month} {date.year}</p>
                    {countdown && (
                      <span style={{
                        fontFamily: '"DM Mono", monospace', fontSize: '0.62rem',
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        padding: '0.2rem 0.6rem',
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        borderRadius: '2rem', color: 'var(--gold)',
                      }}>
                        {countdown}
                      </span>
                    )}
                  </div>
                  <h2 style={{
                    fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
                    fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.0,
                    margin: 0,
                  }}>
                    {day.title}
                  </h2>
                </div>
                {totalSlots > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.75rem', fontWeight: 300, color: availableSlots > 0 ? 'var(--gold)' : 'var(--text-low)', margin: 0, lineHeight: 1 }}>
                      {availableSlots}/{totalSlots}
                    </p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.25rem 0 0' }}>
                      designs available
                    </p>
                  </div>
                )}
              </div>

              {day.description && (
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.75, maxWidth: '52ch', marginBottom: '2rem' }}>
                  {day.description}
                </p>
              )}

              {/* Slots grid */}
              {day.slots.length === 0 ? (
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', color: 'var(--text-low)', letterSpacing: '0.1em' }}>
                  Designs will be announced soon — check back closer to the date.
                </p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1.25rem',
                }}>
                  {day.slots.map(slot => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onClaim={s => setClaimingSlot({ slot: s, dayTitle: day.title })}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

      </section>

      {/* CTA strip */}
      {!loading && flashDays.length > 0 && (
        <>
          <div className="section-divider"><span>HOM</span></div>
          <section style={{ padding: '4rem 1.5rem 6rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 55% 50% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 65%)',
              pointerEvents: 'none',
            }} />
            <p className="eyebrow" style={{ marginBottom: '1rem' }}>Want something drawn just for you?</p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
              fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.05,
              marginBottom: '1.5rem',
            }}>
              That&apos;s what we&apos;re really here for.
            </h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/booking" className="btn-primary">
                <span>Book a session</span>
                <span className="btn-icon" aria-hidden="true">↗</span>
              </Link>
              <Link href="/booking?mode=consultation" className="btn-secondary">
                Request a consultation
              </Link>
            </div>
          </section>
        </>
      )}

      {/* Claim modal */}
      {claimingSlot && (
        <ClaimModal
          slot={claimingSlot.slot}
          dayTitle={claimingSlot.dayTitle}
          onClose={() => setClaimingSlot(null)}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}
