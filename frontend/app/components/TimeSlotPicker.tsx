'use client';

export const TIME_SLOTS = [
  { id: '09:00-11:00', label: '9am – 11am', short: '09:00' },
  { id: '11:00-13:00', label: '11am – 1pm', short: '11:00' },
  { id: '13:00-15:00', label: '1pm – 3pm', short: '13:00' },
  { id: '15:00-17:00', label: '3pm – 5pm', short: '15:00' },
  { id: '17:00-19:00', label: '5pm – 7pm', short: '17:00' },
  { id: '19:00-21:00', label: '7pm – 9pm', short: '19:00' },
];

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
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
        {formattedDate}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
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
                padding: '0.75rem 0.5rem',
                border: selected
                  ? '1px solid var(--gold)'
                  : available
                  ? '1px solid var(--border)'
                  : '1px solid rgba(42,37,32,0.4)',
                borderRadius: '0.5rem',
                background: selected ? 'rgba(201,168,76,0.13)' : 'transparent',
                cursor: available ? 'pointer' : 'not-allowed',
                textAlign: 'center',
                opacity: available ? 1 : 0.3,
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
                lineHeight: 1.2,
              }}>
                {slot.label}
              </p>
              {!available && (
                <p style={{
                  margin: '0.2rem 0 0',
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.48rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-low)',
                }}>
                  {status === 'booked' ? 'Booked' : 'Unavail.'}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
