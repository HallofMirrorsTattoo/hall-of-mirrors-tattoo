import pkg from 'pg';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const { Client } = pkg;

/**
 * Resolves an initial password for a seeded artist account.
 * - Reads from the given env var if set (e.g. INITIAL_ROBYN_PASSWORD)
 * - Otherwise generates a cryptographically random 24-char password and
 *   prints it to the deploy log exactly once. The owner reads it, logs in,
 *   and changes it immediately. No password ever appears in source.
 */
function resolveSeedPassword(envVar: string, accountLabel: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 8) return fromEnv;
  const generated = randomBytes(18).toString('base64url'); // ~24 url-safe chars
  console.log(
    `\n🔐 [seed] Generated initial password for ${accountLabel}: ${generated}\n` +
    `   Set ${envVar} in Railway to skip this, or log in and change it now.\n`
  );
  return generated;
}

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
    cancellation_policy_hours INTEGER NOT NULL DEFAULT 48,
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
    appointment_status TEXT NOT NULL DEFAULT 'pending_review',
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
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS consultation_id TEXT;
ALTER TABLE "Message" ALTER COLUMN body DROP NOT NULL;
ALTER TABLE "Message" ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS counter_offer_date DATE;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS counter_offer_time TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS counter_offer_note TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS counter_offered_by TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS client_budget DECIMAL(10,2);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS price_offer_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS price_offer_note TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'not_set';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS intake_sent_at TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS artist_notes TEXT;
ALTER TABLE "Artist" ADD COLUMN IF NOT EXISTS weekly_summary_last_sent DATE;
ALTER TABLE "Artist" ADD COLUMN IF NOT EXISTS portrait_url TEXT;
ALTER TABLE "Artist" ADD COLUMN IF NOT EXISTS booking_window_months INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS price_estimate_from DECIMAL(10,2);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS price_estimate_to DECIMAL(10,2);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS deposit_paid_date TIMESTAMP;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS deposit_payment_method TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Bump existing studio rows from the old 24-hour default to the canonical 48-hour policy.
-- Safe to re-run: only updates rows still on the old default.
UPDATE "Studio" SET cancellation_policy_hours = 48 WHERE cancellation_policy_hours = 24;

-- Studio social handles default to the studio account. Without this, the seed
-- left them NULL and the studio-settings dashboard or older seeds had pointed
-- them at the founder's personal accounts. Safe to re-run: only fills nulls
-- or replaces a known personal handle with the canonical studio one.
UPDATE "Studio"
  SET instagram_handle = 'hallofmirrorstattoo'
  WHERE instagram_handle IS NULL OR instagram_handle = '';
UPDATE "Studio"
  SET tiktok_handle = 'hallofmirrorstattoo'
  WHERE tiktok_handle IS NULL OR tiktok_handle = '';

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

CREATE TABLE IF NOT EXISTS "DesignIdea" (
    design_idea_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    booking_id TEXT,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES "Booking"(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "DesignIdea_user_id_idx" ON "DesignIdea"(user_id);
CREATE INDEX IF NOT EXISTS "DesignIdea_booking_id_idx" ON "DesignIdea"(booking_id);

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

CREATE TABLE IF NOT EXISTS "Message" (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES "Booking"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Message_booking_id_idx" ON "Message"(booking_id);

CREATE TABLE IF NOT EXISTS "FlashDay" (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    event_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES "Artist"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "FlashDay_artist_id_idx" ON "FlashDay"(artist_id);
CREATE INDEX IF NOT EXISTS "FlashDay_event_date_idx" ON "FlashDay"(event_date);

CREATE TABLE IF NOT EXISTS "FlashSlot" (
    id TEXT PRIMARY KEY,
    flash_day_id TEXT NOT NULL,
    title TEXT NOT NULL,
    price_pence INTEGER NOT NULL,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    claimed_by_user_id TEXT,
    claimed_by_name TEXT,
    claimed_by_email TEXT,
    claimed_by_phone TEXT,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flash_day_id) REFERENCES "FlashDay"(id) ON DELETE CASCADE,
    FOREIGN KEY (claimed_by_user_id) REFERENCES "User"(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "FlashSlot_flash_day_id_idx" ON "FlashSlot"(flash_day_id);

CREATE TABLE IF NOT EXISTS "PortfolioPhoto" (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    public_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES "Artist"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PortfolioPhoto_artist_id_idx" ON "PortfolioPhoto"(artist_id, display_order);

CREATE TABLE IF NOT EXISTS "ArtistGoogleToken" (
    artist_id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expiry_date BIGINT,
    google_email TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES "Artist"(id) ON DELETE CASCADE
);

-- Single canonical studio row. Older seeds wrote both 'hom-studio' and
-- 'default-studio' — we converged on 'default-studio' because every Booking
-- references it via studio_id. The duplicate is removed below if present.
INSERT INTO "Studio" (id, studio_name, address, postcode, cancellation_policy_hours, created_at, updated_at)
VALUES ('default-studio', 'Hall of Mirrors Tattoo', 'Suite 3, 34 Castle Street', 'L2 0NR', 48, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Drop the legacy duplicate row if it exists. Safe because nothing FKs to it.
DELETE FROM "Studio" WHERE id = 'hom-studio';
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
          ['default-studio', 'Hall of Mirrors Tattoo', 'Suite 3, 34 Castle Street', 'L2 0NR', '', 'studio@hallofmirrorstattoo.com', '10:00', '18:00', '10:00', '18:00', '10:00', '18:00', '10:00', '18:00', '10:00', '18:00', '10:00', '18:00']
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
        const robynPassword = resolveSeedPassword('INITIAL_ROBYN_PASSWORD', 'robyn@hallofmirrorstattoo.com');
        const robynHash = await bcrypt.hash(robynPassword, 10);
        await client.query(
          `INSERT INTO "Artist" (id, studio_id, full_name, email, password_hash, specialties, years_experience, bio, instagram_handle, is_active, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          ['artist-robyn-001', 'default-studio', 'Robyn', 'robyn@hallofmirrorstattoo.com', robynHash, 'Neo-traditional, custom designs', 8, 'Bespoke neo-traditional tattoo artist at Hall of Mirrors, Liverpool.', 'hallofmirrorstattoo', true, 'artist']
        );
        console.log('✅ Default artist Robyn created');
      } else {
        console.log('✅ Default artist Robyn exists');
      }

      // Check if Cristina exists — second resident artist.
      // Initial password is resolved from INITIAL_CRISTINA_PASSWORD env var,
      // or generated randomly and printed to the deploy log on first run.
      // No password ever appears in source.
      const cristinaResult = await client.query(
        'SELECT id FROM "Artist" WHERE email = $1',
        ['cristina@hallofmirrorstattoo.com']
      );

      const CRISTINA_BIO = [
        "My name is Cristina. My tattoo name is Superstea. And my personal philosophy is simple: drink Coke, wear Adidas Hyper Sleek and make beautiful tattoos. I spend my work hours between neo-trad with a twist and blackwork illustrative.",
        "When I'm not drawing or tattooing, I'm usually obsessing about time travel, the simulation theory, alternate realities, post-apocalyptic fashion and whether Jedi mind tricks should be taught in schools. I used to be a journalist and write news for a national news television in Romania, but the love for tattooing won and now I'm helping people customise their avatar, while using a vegan set-up (because no one has to suffer for the pictures we put under the skin).",
        "The things I like tattooing the most are somewhere between a Victorian botanist's notebook and a fever dream. Wild flowers, poisonous plants, animal skulls or forgotten relics, but I won't say 'no' to pop culture either. If any of this sounds good to you, maybe we're running on similar software. Whether you're looking to mark a milestone, reclaim a piece of yourself or simply give your character a very cool upgrade, I'd love to help. Get in touch and let's start designing your next tattoo.",
      ].join('\n\n');

      if (cristinaResult.rows.length === 0) {
        console.log('🔄 Creating artist Cristina...');
        const cristinaPassword = resolveSeedPassword('INITIAL_CRISTINA_PASSWORD', 'cristina@hallofmirrorstattoo.com');
        const cristinaHash = await bcrypt.hash(cristinaPassword, 10);
        await client.query(
          `INSERT INTO "Artist" (
             id, studio_id, full_name, email, password_hash,
             bio, instagram_handle, portrait_url,
             is_active, role, booking_window_months, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5,
             $6, $7, $8,
             $9, $10, $11, NOW(), NOW()
           )`,
          [
            'artist-cristina-001',
            'default-studio',
            'Cristina',
            'cristina@hallofmirrorstattoo.com',
            cristinaHash,
            CRISTINA_BIO,
            'supersteatattoo',
            '/assets/artists/cristina.jpg',
            true,
            'artist',
            3,
          ]
        );
        console.log('✅ Artist Cristina created');
      } else {
        // Keep bio + instagram + portrait in sync with the canonical copy
        // until Cristina starts editing them from her dashboard. Only updates
        // rows where the bio is empty so we don't stomp on her edits.
        await client.query(
          `UPDATE "Artist"
             SET bio = COALESCE(NULLIF(bio, ''), $1),
                 instagram_handle = COALESCE(NULLIF(instagram_handle, ''), $2),
                 portrait_url = COALESCE(NULLIF(portrait_url, ''), $3)
           WHERE email = $4`,
          [CRISTINA_BIO, 'supersteatattoo', '/assets/artists/cristina.jpg', 'cristina@hallofmirrorstattoo.com']
        );
        console.log('✅ Artist Cristina exists');
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
