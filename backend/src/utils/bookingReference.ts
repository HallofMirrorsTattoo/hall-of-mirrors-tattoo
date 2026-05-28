import type { Client } from 'pg';

// Reference format: HOM-[WI-]YYMMDD-NNN
//   prefix      = "HOM"           always
//   variantTag  = "WI" for walk-ins, omitted otherwise
//   yymmdd      = booking creation date (compact, sortable)
//   nnn         = 3-digit sequence within that day for that variant
//
// Concurrent inserts can race and pick the same sequence; the booking_reference
// UNIQUE constraint catches it and the caller retries with the next number.

export interface BookingReferenceAllocator {
  prefix: string;       // e.g. "HOM-260528" or "HOM-WI-260528"
  initialReference: string;
  nextReference(after: number): string;
}

export function buildBookingReferenceAllocator(walkIn = false): BookingReferenceAllocator {
  const now = new Date();
  const yy = String(now.getFullYear() % 100).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = walkIn ? `HOM-WI-${yy}${mm}${dd}` : `HOM-${yy}${mm}${dd}`;
  return {
    prefix,
    initialReference: `${prefix}-001`,
    nextReference: (after: number) => `${prefix}-${String(after).padStart(3, '0')}`,
  };
}

/**
 * Insert a row whose unique column is booking_reference, retrying on collision.
 *
 * @param client    a connected pg Client (or pool client)
 * @param walkIn    whether to prefix with WI
 * @param insert    callback that performs the INSERT given the chosen reference.
 *                  Throw any error; we only retry on Postgres unique_violation (23505).
 */
export async function allocateBookingReference(
  client: Client,
  walkIn: boolean,
  insert: (reference: string) => Promise<void>,
  maxAttempts = 6,
): Promise<string> {
  const allocator = buildBookingReferenceAllocator(walkIn);
  const countResult = await client.query(
    `SELECT COUNT(*)::int AS n FROM "Booking" WHERE booking_reference LIKE $1`,
    [`${allocator.prefix}-%`],
  );
  let nextSeq = (countResult.rows[0]?.n ?? 0) + 1;
  let reference = allocator.nextReference(nextSeq);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await insert(reference);
      return reference;
    } catch (err: unknown) {
      const code = (err && typeof err === 'object' && 'code' in err) ? (err as { code?: string }).code : undefined;
      if (code !== '23505') throw err;
      nextSeq += 1;
      reference = allocator.nextReference(nextSeq);
    }
  }
  throw new Error('Could not allocate a booking reference after multiple attempts. Please try again.');
}
