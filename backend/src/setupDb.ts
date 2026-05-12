import pkg from 'pg';

const { Client } = pkg;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TIMESTAMP,
    phone TEXT,
    address TEXT,
    city TEXT,
    postcode TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    account_status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Studio" (
    id TEXT PRIMARY KEY,
    studio_name TEXT NOT NULL DEFAULT 'Hall of Mirrors Tattoo',
    address TEXT NOT NULL,
    postcode TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    hours_monday_start TEXT,
    hours_monday_end TEXT,
    hours_tuesday_start TEXT,
    hours_tuesday_end TEXT,
    hours_wednesday_start TEXT,
    hours_wednesday_end TEXT,
    hours_thursday_start TEXT,
    hours_thursday_end TEXT,
    hours_friday_start TEXT,
    hours_friday_end TEXT,
    hours_saturday_start TEXT,
    hours_saturday_end TEXT,
    hours_sunday_start TEXT,
    hours_sunday_end TEXT,
    deposit_amount_fixed DECIMAL(10,2),
    deposit_percentage DECIMAL(5,2),
    cancellation_policy_hours INTEGER NOT NULL DEFAULT 24,
    about_section TEXT,
    instagram_handle TEXT,
    facebook_url TEXT,
    tiktok_handle TEXT,
    council_registration_ref TEXT,
    hepatitis_b_vaccination_date TIMESTAMP,
    professional_body_membership TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Booking" (
    id TEXT PRIMARY KEY,
    studio_id TEXT NOT NULL,
    artist_id TEXT,
    user_id TEXT,
    guest_email TEXT,
    guest_name TEXT,
    guest_phone TEXT,
    booking_reference TEXT NOT NULL UNIQUE,
    appointment_date_time TIMESTAMP NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 120,
    appointment_status TEXT NOT NULL DEFAULT 'pending_consent',
    tattoo_type TEXT NOT NULL DEFAULT 'new_tattoo',
    tattoo_description TEXT,
    placement TEXT,
    estimated_size TEXT,
    color_or_bw TEXT,
    artist_notes TEXT,
    design_approved BOOLEAN NOT NULL DEFAULT false,
    deposit_amount DECIMAL(10,2) NOT NULL,
    deposit_paid BOOLEAN NOT NULL DEFAULT false,
    deposit_payment_method TEXT,
    deposit_paid_date TIMESTAMP,
    final_price_estimate DECIMAL(10,2),
    final_price_paid DECIMAL(10,2),
    final_payment_method TEXT,
    balance_due DECIMAL(10,2) NOT NULL,
    cancellation_reason TEXT,
    cancellation_initiated_by TEXT,
    cancellation_date TIMESTAMP,
    refund_issued BOOLEAN NOT NULL DEFAULT false,
    refund_amount DECIMAL(10,2),
    client_no_show BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "ConsultationRequest" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    tattoo_idea TEXT NOT NULL,
    preferred_contact_method TEXT,
    preferred_timeframe TEXT,
    consultation_status TEXT NOT NULL DEFAULT 'new',
    assigned_to TEXT,
    assigned_date TIMESTAMP,
    response_date TIMESTAMP,
    response_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ContactFormSubmission" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_status TEXT NOT NULL DEFAULT 'new',
    responded_by TEXT,
    response_date TIMESTAMP,
    response_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Artist" (
    id TEXT PRIMARY KEY,
    studio_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    specialties TEXT,
    years_experience INTEGER,
    bio TEXT,
    instagram_handle TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    role TEXT NOT NULL DEFAULT 'artist',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Consultation" (
    consultation_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    artist_id TEXT NOT NULL,
    message TEXT NOT NULL,
    preferred_dates TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    artist_response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES "Artist"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Booking_user_id_idx" ON "Booking"(user_id);
CREATE INDEX IF NOT EXISTS "Artist_email_idx" ON "Artist"(email);
CREATE INDEX IF NOT EXISTS "Consultation_artist_id_idx" ON "Consultation"(artist_id);
CREATE INDEX IF NOT EXISTS "Consultation_user_id_idx" ON "Consultation"(user_id);

CREATE TABLE IF NOT EXISTS "AvailabilityBlock" (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    blocked_date DATE NOT NULL,
    blocked_slot TEXT,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES "Artist"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AvailabilityBlock_artist_date_idx" ON "AvailabilityBlock"(artist_id, blocked_date);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS appointment_time TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS notify_end_time BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "MedicalHistory" (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    pregnant_or_breastfeeding BOOLEAN NOT NULL DEFAULT false,
    blood_borne_conditions BOOLEAN NOT NULL DEFAULT false,
    diabetes BOOLEAN NOT NULL DEFAULT false,
    heart_condition BOOLEAN NOT NULL DEFAULT false,
    haemophilia_or_bleeding_disorder BOOLEAN NOT NULL DEFAULT false,
    epilepsy_or_seizure BOOLEAN NOT NULL DEFAULT false,
    skin_conditions TEXT,
    autoimmune_conditions BOOLEAN NOT NULL DEFAULT false,
    blood_thinners BOOLEAN NOT NULL DEFAULT false,
    steroids_or_immunosuppressants BOOLEAN NOT NULL DEFAULT false,
    alcohol_or_drugs_last_24h BOOLEAN NOT NULL DEFAULT false,
    known_allergies TEXT,
    allergies_latex BOOLEAN NOT NULL DEFAULT false,
    allergies_ink BOOLEAN NOT NULL DEFAULT false,
    allergies_topical_anaesthetics BOOLEAN NOT NULL DEFAULT false,
    previous_tattoo_reaction BOOLEAN NOT NULL DEFAULT false,
    previous_reaction_details TEXT,
    chemotherapy_or_radiotherapy BOOLEAN NOT NULL DEFAULT false,
    current_medications TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "ConsentForm" (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    booking_id TEXT NOT NULL UNIQUE,
    form_reference_no TEXT NOT NULL UNIQUE,
    full_name_signed TEXT NOT NULL,
    date_signed TIMESTAMP NOT NULL,
    age_confirmed BOOLEAN NOT NULL DEFAULT false,
    health_accuracy_confirmed BOOLEAN NOT NULL DEFAULT false,
    risks_understood_confirmed BOOLEAN NOT NULL DEFAULT false,
    sobriety_confirmed BOOLEAN NOT NULL DEFAULT false,
    suitability_confirmed BOOLEAN NOT NULL DEFAULT false,
    voluntary_consent_confirmed BOOLEAN NOT NULL DEFAULT false,
    design_approved_confirmed BOOLEAN NOT NULL DEFAULT false,
    aftercare_responsibility_confirmed BOOLEAN NOT NULL DEFAULT false,
    photography_permission BOOLEAN NOT NULL DEFAULT false,
    gdpr_consent_confirmed BOOLEAN NOT NULL DEFAULT false,
    form_status TEXT NOT NULL DEFAULT 'signed',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES "Booking"(id) ON DELETE CASCADE
);
`;

export async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Setting up database schema...');
    await client.connect();

    // Split by semicolon and execute each statement
    const statements = SCHEMA_SQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      try {
        await client.query(statement);
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1];
          if (tableName) {
            console.log(`  ✓ Table "${tableName}" ready`);
          }
        }
      } catch (err: any) {
        // Ignore "already exists" errors
        if (err.message?.includes('already exists') || err.code === 'P3002' || err.code === '42P05') {
          continue;
        }
        console.warn(`⚠️ Statement warning (continuing):`, statement.substring(0, 50), err.message);
      }
    }

    console.log('✅ Database schema ready');

    // Create default studio if it doesn't exist (using raw pg.Client to avoid Prisma pooling issues)
    try {
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
      });
      await client.connect();

      // Check if studio exists
      const studioResult = await client.query(
        'SELECT id FROM "Studio" WHERE id = $1',
        ['default-studio']
      );

      if (studioResult.rows.length === 0) {
        console.log('🔄 Creating default studio...');
        await client.query(
          `INSERT INTO "Studio" (id, studio_name, address, postcode, phone, email, hours_monday_start, hours_monday_end, hours_tuesday_start, hours_tuesday_end, hours_wednesday_start, hours_wednesday_end, hours_thursday_start, hours_thursday_end, hours_friday_start, hours_friday_end, hours_saturday_start, hours_saturday_end, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())`,
          ['default-studio', 'Hall of Mirrors Tattoo', '123 High Street', 'AB12 3CD', '+44 123 456 7890', 'bookings@hallofmirrors.tattoo', '10:00', '18:00', '10:00', '18:00', '10:00', '18:00', '10:00', '18:00', '10:00', '18:00', '10:00', '16:00']
        );
        console.log('✅ Default studio created');
      } else {
        console.log('✅ Default studio exists');
      }

      // Check if Robyn exists
      const artistResult = await client.query(
        'SELECT id FROM "Artist" WHERE email = $1',
        ['robyn@hallofmirrorstattoo.com']
      );

      if (artistResult.rows.length === 0) {
        console.log('🔄 Creating default artist Robyn...');
        await client.query(
          `INSERT INTO "Artist" (id, studio_id, full_name, email, password_hash, specialties, years_experience, bio, instagram_handle, is_active, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          ['artist-robyn-001', 'default-studio', 'Robyn', 'robyn@hallofmirrorstattoo.com', '$2b$10$bwCLFm5mDzcPdPEdHxtpI.ImZAwxdzrpVl7xoymsE0vRObCPq1V7q', 'Neo-traditional, custom designs', 8, 'Bespoke neo-traditional tattoo artist at Hall of Mirrors, Liverpool.', 'hallofmirrorstattoo', true, 'artist']
        );
        console.log('✅ Default artist Robyn created');
      } else {
        // Fix bad seed hash if it was created with the wrong hash (one-time migration)
        await client.query(
          `UPDATE "Artist" SET password_hash = $1 WHERE email = $2 AND password_hash = $3`,
          [
            '$2b$10$bwCLFm5mDzcPdPEdHxtpI.ImZAwxdzrpVl7xoymsE0vRObCPq1V7q',
            'robyn@hallofmirrorstattoo.com',
            '$2b$10$Y4qE2Mzj8Y3ZH5L4KQ9sJewQqV9C4mZ2H8K6D2X9L5Y8O1P2Q3R4',
          ]
        );
        console.log('✅ Default artist Robyn exists');
      }

      await client.end();
    } catch (err) {
      console.warn('⚠️ Studio/Artist creation warning:', (err as any).message);
    }

    return true;
  } catch (error) {
    console.error('❌ Database setup error:', error);
    // Don't crash - tables might exist, let the app try to use the database
    return false;
  } finally {
    await client.end();
  }
}
