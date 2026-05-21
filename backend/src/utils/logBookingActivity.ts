import pkg from 'pg';
const { Client } = pkg;

export interface ActivityPayload {
  bookingId: string;
  actorType: 'artist' | 'client' | 'system';
  action: string;
  originalDate?: string | null;   // YYYY-MM-DD
  originalTime?: string | null;   // HH:MM
  proposedDate?: string | null;
  proposedTime?: string | null;
  note?: string | null;
}

/** Log a booking activity entry. Pass an already-connected pg Client instance. */
export async function logBookingActivity(client: InstanceType<typeof Client>, payload: ActivityPayload): Promise<void> {
  try {
    await client.query(
      `INSERT INTO "BookingActivity"
         (id, booking_id, actor_type, action, original_date, original_time, proposed_date, proposed_time, note)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        payload.bookingId,
        payload.actorType,
        payload.action,
        payload.originalDate ?? null,
        payload.originalTime ?? null,
        payload.proposedDate ?? null,
        payload.proposedTime ?? null,
        payload.note ?? null,
      ]
    );
  } catch (err) {
    // Never fail the parent request because of logging
    console.error('[BookingActivity] Failed to log:', err);
  }
}
