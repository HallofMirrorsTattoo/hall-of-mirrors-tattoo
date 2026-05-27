'use client';

import { useState, useEffect, useCallback } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface AvailabilityData {
  blockedDays: string[];
  slotData: Record<string, { blocked: string[]; booked: string[] }>;
  blocks: Array<{ id: string; blocked_date: string; blocked_slot: string | null; reason: string | null }>;
  bookingWindowMonths?: number;
  maxBookingDate?: string; // YYYY-MM-DD inclusive
}

interface Props {
  artistId: string;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onAvailabilityLoad?: (data: AvailabilityData) => void;
  /**
   * When true (default), grays out dates and locks month navigation beyond the
   * artist's booking window. Set false for artist-side flows where the artist
   * needs to pick dates further out (e.g. counter-offers, reschedules).
   */
  enforceBookingWindow?: boolean;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AvailabilityCalendar({
  artistId,
  selectedDate,
  onDateSelect,
  onAvailabilityLoad,
  enforceBookingWindow = true,
}: Props) {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  const fetchAvailability = useCallback(async () => {
    if (!artistId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/availability/${artistId}?month=${monthKey}`
      );
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
        onAvailabilityLoad?.(data);
      }
    } catch {
      // calendar still renders — all dates treated as available
    } finally {
      setIsLoading(false);
    }
  }, [artistId, monthKey, onAvailabilityLoad]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Build calendar grid (Mon-start, 6 weeks max = 42 cells)
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);

  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0

  type Cell = { dateStr: string; inMonth: boolean };
  const cells: Cell[] = [];

  for (let i = 0; i < startDow; i++) {
    const d = new Date(viewYear, viewMonth, 1 - (startDow - i));
    cells.push({ dateStr: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()), inMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ dateStr: toDateStr(viewYear, viewMonth, d), inMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(viewYear, viewMonth + 1, i);
    cells.push({ dateStr: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()), inMonth: false });
  }

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  // Booking window cap: parse maxBookingDate ('YYYY-MM-DD') into year/month.
  const maxDateStr = enforceBookingWindow ? availability?.maxBookingDate : undefined;
  const [maxYear, maxMonth] = maxDateStr
    ? [parseInt(maxDateStr.substring(0, 4), 10), parseInt(maxDateStr.substring(5, 7), 10) - 1]
    : [Infinity, Infinity];

  const canGoNext = !maxDateStr
    ? true
    : viewYear < maxYear || (viewYear === maxYear && viewMonth < maxMonth);

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const navBtn: React.CSSProperties = {
    width: '2rem', height: '2rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: '50%',
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: 'var(--text-mid)',
    transition: 'border-color 0.25s ease, color 0.25s ease',
    flexShrink: 0,
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{ ...navBtn, opacity: canGoPrev ? 1 : 0.25, cursor: canGoPrev ? 'pointer' : 'default' }}
          onMouseEnter={(e) => canGoPrev && (e.currentTarget.style.borderColor = 'var(--gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          aria-label="Previous month"
        >
          ←
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            margin: 0,
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1.25rem',
            color: 'var(--cream)',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}>
            {MONTHS[viewMonth]}
          </p>
          <p style={{
            margin: '0.125rem 0 0',
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-low)',
          }}>
            {viewYear}
          </p>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          disabled={!canGoNext}
          style={{ ...navBtn, opacity: canGoNext ? 1 : 0.25, cursor: canGoNext ? 'pointer' : 'default' }}
          onMouseEnter={(e) => canGoNext && (e.currentTarget.style.borderColor = 'var(--gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.125rem', marginBottom: '0.375rem' }}>
        {DAYS.map((d) => (
          <div key={d} style={{
            textAlign: 'center',
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-mid)',
            padding: '0.25rem 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            background: 'rgba(14,12,9,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '0.5rem',
          }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
              Loading
            </span>
          </div>
        )}

        {cells.map(({ dateStr, inMonth }) => {
          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          const isPastWindow = !!maxDateStr && dateStr > maxDateStr;
          const isBlocked = inMonth && !isPast && !isPastWindow && (availability?.blockedDays.includes(dateStr) ?? false);
          const isSelected = selectedDate === dateStr;
          const isClickable = inMonth && !isPast && !isBlocked && !isPastWindow;
          const dayNum = parseInt(dateStr.split('-')[2], 10);

          let bg = 'transparent';
          let border = '1px solid transparent';
          let color = 'var(--text)';
          let opacity = 1;
          let textDecoration = 'none';

          if (!inMonth) {
            opacity = 0;
          } else if (isSelected) {
            bg = 'rgba(201,168,76,0.14)';
            border = '1px solid var(--gold)';
            color = 'var(--gold)';
          } else if (isToday) {
            border = '1px solid rgba(201,168,76,0.35)';
            color = 'var(--cream)';
          } else if (isPast) {
            color = 'var(--text-low)';
            opacity = 0.3;
          } else if (isPastWindow) {
            color = 'var(--text-low)';
            opacity = 0.22;
          } else if (isBlocked) {
            color = 'var(--text-low)';
            opacity = 0.28;
            textDecoration = 'line-through';
          }

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => isClickable && onDateSelect(dateStr)}
              disabled={!isClickable}
              aria-label={dateStr}
              aria-selected={isSelected}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: bg,
                border,
                borderRadius: '0.375rem',
                cursor: isClickable ? 'pointer' : 'default',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.8rem',
                fontWeight: isToday ? 500 : 400,
                color,
                opacity,
                textDecoration,
                transition: 'background 0.18s ease, border-color 0.18s ease, color 0.18s ease',
              }}
              onMouseEnter={(e) => {
                if (isClickable && !isSelected) {
                  e.currentTarget.style.background = 'rgba(201,168,76,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.28)';
                }
              }}
              onMouseLeave={(e) => {
                if (isClickable && !isSelected) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              {inMonth ? dayNum : ''}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
        {[
          { swatch: { border: '1px solid var(--border)' }, label: 'Available' },
          { swatch: { border: '1px solid var(--gold)', background: 'rgba(201,168,76,0.14)' }, label: 'Selected' },
          { swatch: { border: '1px solid var(--border)', opacity: 0.28 }, label: 'Unavailable' },
        ].map(({ swatch, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.2rem', display: 'block', ...swatch }} />
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Booking window notice — only when enforced and we have a max date */}
      {maxDateStr && (
        <p style={{
          margin: '0.875rem 0 0',
          fontFamily: '"DM Mono", monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(154,144,130,0.65)',
          textAlign: 'center',
        }}>
          Bookings open through {new Date(`${maxDateStr}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}
