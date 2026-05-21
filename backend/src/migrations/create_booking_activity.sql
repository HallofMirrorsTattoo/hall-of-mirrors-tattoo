CREATE TABLE IF NOT EXISTS "BookingActivity" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  actor_type VARCHAR(10) NOT NULL CHECK (actor_type IN ('artist', 'client', 'system')),
  action VARCHAR(60) NOT NULL,
  original_date DATE,
  original_time VARCHAR(10),
  proposed_date DATE,
  proposed_time VARCHAR(10),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_booking_activity_booking_id ON "BookingActivity"(booking_id);
