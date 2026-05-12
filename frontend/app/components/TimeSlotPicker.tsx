'use client';

function fmt(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

export const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 9 + i;
  return { id: `${String(hour).padStart(2, '0')}:00`, label: fmt(hour) };
});

interface Props {
  date: string;
  selectedSlot: string | null;
  onSlotSelect: (slot: string) => void;
  slotData?: Record<string, { blocked: string[]; booked: string[] }>;
}

type SlotStatus = 'available' | 'blocked' | 'booked';

export default function TimeSlotPicker({ date, selectedSlot, onSlotSelect, slotData }: Props) {
  const dateSlots = slotData?.[date];

  function getStatus(slotId: string): SlotStatus {
    if (!dateSlots) return 'available';
    if (dateSlots.blocked.includes(slotId)) return 'blocked';
    if (dateSlots.booked.includes(slotId)) return 'booked';
    return 'available';
  }

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div>
      <p style={{
        margin: '0 0 0.875rem',
        fontFamily: '"DM Mono", monospace',
        fontSize: '0.575rem',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'rgba(201,168,76,0.65)',
      }}>
        {formattedDate} — choose a start time
      </p>

      {/* 4 columns × 3 rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        {TIME_SLOTS.map((slot) => {
          const status = getStatus(slot.id);
          const available = status === 'available';
          const selected = selectedSlot === slot.id;

          return (
            <button
              key={slot.id}
              onClick={() => available && onSlotSelect(slot.id)}
              disabled={!available}
              style={{
                padding: '0.625rem 0.25rem',
                border: selected
                  ? '1px solid var(--gold)'
                  : available
                  ? '1px solid var(--border)'
                  : '1px solid rgba(42,37,32,0.4)',
                borderRadius: '0.5rem',
                background: selected ? 'rgba(201,168,76,0.13)' : 'transparent',
                cursor: available ? 'pointer' : 'not-allowed',
                textAlign: 'center',
                opacity: available ? 1 : 0.28,
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                if (available && !selected) {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.38)';
                  e.currentTarget.style.background = 'rgba(201,168,76,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (available && !selected) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <p style={{
                margin: 0,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.8125rem',
                fontWeight: selected ? 500 : 400,
                color: selected ? 'var(--gold)' : available ? 'var(--text)' : 'var(--text-low)',
                textDecoration: !available ? 'line-through' : 'none',
                textDecorationColor: 'var(--text-low)',
              }}>
                {slot.label}
              </p>
              {!available && (
                <p style={{
                  margin: '0.15rem 0 0',
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.45rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-low)',
                }}>
                  {status === 'booked' ? 'Taken' : 'Unavail.'}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
