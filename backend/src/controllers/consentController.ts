import { Request, Response } from 'express';
import pkg from 'pg';
import { randomUUID } from 'crypto';
import { generateConsentFormPDF } from '../services/pdfService.js';
import { sendConsentFormToClient, sendConsentFormToStudio } from '../services/emailService.js';
import { allocateBookingReference } from '../utils/bookingReference.js';
import { uploadToSupabase } from '../utils/storage.js';

const { Client } = pkg;

export async function getConsentForm(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { bookingId } = req.params;
    await client.connect();

    // Verify booking belongs to this user — also match by email (stub-user fallback)
    const bookingCheck = await client.query(
      `SELECT b.id, b.booking_reference, b.appointment_date_time, b.placement, b.tattoo_description, b.appointment_status,
              a.full_name as artist_name
       FROM "Booking" b
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       LEFT JOIN "User" u ON b.user_id = u.id
       WHERE b.id = $1 AND (b.user_id = $2 OR u.email = $3)`,
      [bookingId, req.user.id, req.user.email]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    // Get existing consent form if any
    const formResult = await client.query(
      `SELECT * FROM "ConsentForm" WHERE booking_id = $1`,
      [bookingId]
    );

    // Get existing medical history if any
    const medResult = await client.query(
      `SELECT * FROM "MedicalHistory" WHERE user_id = $1`,
      [req.user.id]
    );

    // Get client profile for pre-filling
    const profileResult = await client.query(
      `SELECT first_name, last_name, email, phone, address, city, postcode, date_of_birth FROM "User" WHERE id = $1`,
      [req.user.id]
    );

    res.json({
      success: true,
      booking,
      consentForm: formResult.rows[0] || null,
      medicalHistory: medResult.rows[0] || null,
      profile: profileResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Get consent form error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch consent form' });
  } finally {
    await client.end();
  }
}

export async function submitConsentForm(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { bookingId } = req.params;
    const { medical, consent, fullNameSigned } = req.body;

    if (!fullNameSigned?.trim()) {
      return res.status(400).json({ success: false, error: 'Signature (full name) is required' });
    }

    const requiredConsent = [
      'age_confirmed', 'health_accuracy_confirmed', 'risks_understood_confirmed',
      'sobriety_confirmed', 'suitability_confirmed', 'voluntary_consent_confirmed',
      'design_approved_confirmed', 'aftercare_responsibility_confirmed',
      'photography_permission', 'gdpr_consent_confirmed',
    ];
    for (const field of requiredConsent) {
      if (!consent[field]) {
        return res.status(400).json({ success: false, error: `Please confirm: ${field.replace(/_/g, ' ')}` });
      }
    }

    await client.connect();

    // Verify booking belongs to this user — also match by email (stub-user fallback)
    const bookingResult = await client.query(
      `SELECT b.id, b.booking_reference, b.appointment_date_time, b.placement, b.estimated_size, b.tattoo_description,
              b.user_id, b.guest_email, b.guest_name,
              u.first_name, u.last_name, u.email, u.phone, u.address, u.city, u.postcode,
              a.full_name as artist_name, a.email as artist_email
       FROM "Booking" b
       LEFT JOIN "User" u ON b.user_id = u.id
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.id = $1 AND (b.user_id = $2 OR u.email = $3)`,
      [bookingId, req.user.id, req.user.email]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Check consent form doesn't already exist
    const existing = await client.query(
      `SELECT id FROM "ConsentForm" WHERE booking_id = $1`,
      [bookingId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Consent form already submitted for this booking' });
    }

    const formId = randomUUID();
    const formRef = `CF-${booking.booking_reference}`;
    const now = new Date();

    // Upsert medical history (one per user — updates if re-submitted)
    await client.query(
      `INSERT INTO "MedicalHistory" (
        id, user_id,
        pregnant_or_breastfeeding, blood_borne_conditions, diabetes, heart_condition,
        haemophilia_or_bleeding_disorder, epilepsy_or_seizure, skin_conditions,
        autoimmune_conditions, blood_thinners, steroids_or_immunosuppressants,
        alcohol_or_drugs_last_24h, known_allergies, allergies_latex, allergies_ink,
        allergies_topical_anaesthetics, previous_tattoo_reaction, previous_reaction_details,
        chemotherapy_or_radiotherapy, current_medications, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        pregnant_or_breastfeeding = EXCLUDED.pregnant_or_breastfeeding,
        blood_borne_conditions = EXCLUDED.blood_borne_conditions,
        diabetes = EXCLUDED.diabetes,
        heart_condition = EXCLUDED.heart_condition,
        haemophilia_or_bleeding_disorder = EXCLUDED.haemophilia_or_bleeding_disorder,
        epilepsy_or_seizure = EXCLUDED.epilepsy_or_seizure,
        skin_conditions = EXCLUDED.skin_conditions,
        autoimmune_conditions = EXCLUDED.autoimmune_conditions,
        blood_thinners = EXCLUDED.blood_thinners,
        steroids_or_immunosuppressants = EXCLUDED.steroids_or_immunosuppressants,
        alcohol_or_drugs_last_24h = EXCLUDED.alcohol_or_drugs_last_24h,
        known_allergies = EXCLUDED.known_allergies,
        allergies_latex = EXCLUDED.allergies_latex,
        allergies_ink = EXCLUDED.allergies_ink,
        allergies_topical_anaesthetics = EXCLUDED.allergies_topical_anaesthetics,
        previous_tattoo_reaction = EXCLUDED.previous_tattoo_reaction,
        previous_reaction_details = EXCLUDED.previous_reaction_details,
        chemotherapy_or_radiotherapy = EXCLUDED.chemotherapy_or_radiotherapy,
        current_medications = EXCLUDED.current_medications,
        updated_at = NOW()`,
      [
        randomUUID(), req.user.id,
        !!medical.pregnant_or_breastfeeding, !!medical.blood_borne_conditions, !!medical.diabetes,
        !!medical.heart_condition, !!medical.haemophilia_or_bleeding_disorder, !!medical.epilepsy_or_seizure,
        medical.skin_conditions || null, !!medical.autoimmune_conditions, !!medical.blood_thinners,
        !!medical.steroids_or_immunosuppressants, !!medical.alcohol_or_drugs_last_24h,
        medical.known_allergies || null, !!medical.allergies_latex, !!medical.allergies_ink,
        !!medical.allergies_topical_anaesthetics, !!medical.previous_tattoo_reaction,
        medical.previous_reaction_details || null, !!medical.chemotherapy_or_radiotherapy,
        medical.current_medications || null,
      ]
    );

    // Insert consent form
    await client.query(
      `INSERT INTO "ConsentForm" (
        id, user_id, booking_id, form_reference_no, full_name_signed, date_signed,
        age_confirmed, health_accuracy_confirmed, risks_understood_confirmed, sobriety_confirmed,
        suitability_confirmed, voluntary_consent_confirmed, design_approved_confirmed,
        aftercare_responsibility_confirmed, photography_permission, gdpr_consent_confirmed,
        form_status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        'signed', NOW(), NOW()
      )`,
      [
        formId, req.user.id, bookingId, formRef, fullNameSigned.trim(), now,
        true, true, true, true, true, true, true, true,
        !!consent.photography_permission, true,
      ]
    );

    // Update booking status to confirmed
    await client.query(
      `UPDATE "Booking" SET appointment_status = 'confirmed', updated_at = NOW() WHERE id = $1`,
      [bookingId]
    );

    // Generate PDF
    const dateStr = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(booking.appointment_date_time ? new Date(booking.appointment_date_time) : now);
    const signedStr = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(now);

    const clientEmail = booking.email || booking.guest_email || '';
    const clientName = booking.first_name
      ? `${booking.first_name} ${booking.last_name}`
      : booking.guest_name || 'Client';

    try {
      const pdfBuffer = await generateConsentFormPDF({
        clientName,
        clientEmail,
        clientPhone: booking.phone || '',
        clientAddress: [booking.address, booking.city, booking.postcode].filter(Boolean).join(', '),
        bookingReference: booking.booking_reference,
        appointmentDate: dateStr,
        placement: booking.placement || '',
        artistName: booking.artist_name || 'Hall of Mirrors',
        dateSigned: signedStr,
        fullNameSigned: fullNameSigned.trim(),
        medical: {
          pregnant_or_breastfeeding: !!medical.pregnant_or_breastfeeding,
          blood_borne_conditions: !!medical.blood_borne_conditions,
          diabetes: !!medical.diabetes,
          heart_condition: !!medical.heart_condition,
          haemophilia_or_bleeding_disorder: !!medical.haemophilia_or_bleeding_disorder,
          epilepsy_or_seizure: !!medical.epilepsy_or_seizure,
          skin_conditions: medical.skin_conditions || '',
          autoimmune_conditions: !!medical.autoimmune_conditions,
          blood_thinners: !!medical.blood_thinners,
          steroids_or_immunosuppressants: !!medical.steroids_or_immunosuppressants,
          alcohol_or_drugs_last_24h: !!medical.alcohol_or_drugs_last_24h,
          known_allergies: medical.known_allergies || '',
          allergies_latex: !!medical.allergies_latex,
          allergies_ink: !!medical.allergies_ink,
          allergies_topical_anaesthetics: !!medical.allergies_topical_anaesthetics,
          previous_tattoo_reaction: !!medical.previous_tattoo_reaction,
          previous_reaction_details: medical.previous_reaction_details || '',
          chemotherapy_or_radiotherapy: !!medical.chemotherapy_or_radiotherapy,
          current_medications: medical.current_medications || '',
        },
        consent: {
          age_confirmed: true,
          health_accuracy_confirmed: true,
          risks_understood_confirmed: true,
          sobriety_confirmed: true,
          suitability_confirmed: true,
          voluntary_consent_confirmed: true,
          design_approved_confirmed: true,
          aftercare_responsibility_confirmed: true,
          photography_permission: !!consent.photography_permission,
          gdpr_consent_confirmed: true,
        },
      });

      const pdfBase64 = pdfBuffer.toString('base64');

      if (clientEmail) {
        sendConsentFormToClient({
          clientEmail,
          clientName,
          bookingReference: booking.booking_reference,
          formReference: formRef,
          pdfBase64,
        }).catch((e) => console.error('[email] consent client email failed:', e));
      }

      sendConsentFormToStudio({
        clientName,
        clientEmail,
        bookingReference: booking.booking_reference,
        formReference: formRef,
        pdfBase64,
        // Route a copy to the booking's artist so they see their own clients'
        // signed forms in their own inbox, not just the studio archive.
        artistEmail: booking.artist_email ?? undefined,
      }).catch((e) => console.error('[email] consent studio email failed:', e));
    } catch (pdfErr) {
      console.error('[pdf] generation failed (non-fatal):', pdfErr);
    }

    res.json({
      success: true,
      formReference: formRef,
      message: 'Consent form submitted and booking confirmed.',
    });
  } catch (error) {
    console.error('Submit consent form error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit consent form' });
  } finally {
    await client.end();
  }
}

export async function getClientConsentForms(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    await client.connect();

    // Get bookings for this user — exclude cancelled/declined (no consent needed)
    const result = await client.query(
      `SELECT b.id as booking_id, b.booking_reference, b.appointment_date_time,
              b.placement, b.appointment_status, b.estimated_size,
              a.full_name as artist_name,
              cf.id as consent_form_id, cf.form_reference_no, cf.form_status, cf.date_signed
       FROM "Booking" b
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       LEFT JOIN "ConsentForm" cf ON cf.booking_id = b.id
       LEFT JOIN "User" u ON b.user_id = u.id
       WHERE (b.user_id = $1 OR u.email = $2)
         AND b.appointment_status NOT IN ('cancelled', 'declined', 'rejected')
       ORDER BY b.appointment_date_time DESC`,
      [req.user.id, req.user.email]
    );

    res.json({ success: true, bookings: result.rows });
  } catch (error) {
    console.error('Get client consent forms error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch consent forms' });
  } finally {
    await client.end();
  }
}

// Public walk-in consent submission.
//
// No auth — the form lives at /consent and is reachable by anyone (a QR code in
// the studio sends walk-ins straight to it). Validation, a honeypot field, and
// a 10MB image cap on the ID-proof upload keep abuse manageable.
//
// On submit we:
//   1. Reject if the hidden honeypot field is populated (spam bots).
//   2. Find-or-create the client's User row by email. New rows are stubs
//      (password_hash = '') just like the booking flow leaves behind, so the
//      client can later activate the same account if they want to log in.
//   3. Upsert their MedicalHistory.
//   4. Allocate a walk-in Booking reference (HOM-WI-YYMMDD-NNN) and insert a
//      Booking with appointment_status='walk_in' and today's date/time.
//   5. Upload the ID-proof photo to Supabase and stash the URL on the
//      ConsentForm row (is_walk_in=true). Form is treated as already signed.
//   6. Fire the usual consent PDF + emails (best-effort, non-blocking).
export async function submitWalkInConsentForm(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const file = (req as Request & { file?: Express.Multer.File }).file;
  try {
    // Spam honeypot: real users never see this field, but bots fill in everything.
    if (req.body.website && String(req.body.website).trim() !== '') {
      return res.status(200).json({ success: true, message: 'OK' });
    }

    const {
      first_name, last_name, email, phone, date_of_birth,
      address, city, postcode,
      emergency_contact_name, emergency_contact_phone,
      tattoo_description, placement,
    } = req.body;

    if (!first_name?.trim() || !last_name?.trim()) {
      return res.status(400).json({ success: false, error: 'First and last name are required' });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    if (!date_of_birth) {
      return res.status(400).json({ success: false, error: 'Date of birth is required' });
    }
    if (!placement?.trim()) {
      return res.status(400).json({ success: false, error: 'Placement is required' });
    }
    if (!file) {
      return res.status(400).json({ success: false, error: 'Photo ID is required' });
    }

    // Multipart form fields arrive as JSON strings — parse with safe fallbacks.
    const parseJsonField = (key: string): Record<string, unknown> => {
      const raw = req.body[key];
      if (!raw) return {};
      if (typeof raw === 'object') return raw;
      try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
    };
    const medical = parseJsonField('medical');
    const consent = parseJsonField('consent');
    const fullNameSigned = String(req.body.fullNameSigned ?? '').trim();

    if (!fullNameSigned) {
      return res.status(400).json({ success: false, error: 'Signature (full name) is required' });
    }

    const requiredConsent = [
      'age_confirmed', 'health_accuracy_confirmed', 'risks_understood_confirmed',
      'sobriety_confirmed', 'suitability_confirmed', 'voluntary_consent_confirmed',
      'design_approved_confirmed', 'aftercare_responsibility_confirmed',
      'gdpr_consent_confirmed',
    ];
    for (const field of requiredConsent) {
      if (!consent[field]) {
        return res.status(400).json({ success: false, error: `Please confirm: ${field.replace(/_/g, ' ')}` });
      }
    }

    await client.connect();

    // Find or create the User (stub if new — same shape as the booking flow).
    const existingUser = await client.query(
      `SELECT id, account_status FROM "User" WHERE email = $1`,
      [email]
    );
    let userId: string;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      // Refresh the profile so it's current; never overwrite a real password_hash.
      await client.query(
        `UPDATE "User" SET
          first_name = $1, last_name = $2, phone = $3,
          date_of_birth = $4, address = COALESCE($5, address),
          city = COALESCE($6, city), postcode = COALESCE($7, postcode),
          emergency_contact_name = COALESCE($8, emergency_contact_name),
          emergency_contact_phone = COALESCE($9, emergency_contact_phone),
          updated_at = NOW()
         WHERE id = $10`,
        [first_name, last_name, phone, date_of_birth, address || null, city || null, postcode || null,
         emergency_contact_name || null, emergency_contact_phone || null, userId]
      );
    } else {
      userId = randomUUID();
      await client.query(
        `INSERT INTO "User" (
          id, email, password_hash, first_name, last_name, phone,
          date_of_birth, address, city, postcode,
          emergency_contact_name, emergency_contact_phone,
          account_status, created_at, updated_at
        ) VALUES ($1, $2, '', $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', NOW(), NOW())`,
        [userId, email, first_name, last_name, phone, date_of_birth,
         address || null, city || null, postcode || null,
         emergency_contact_name || null, emergency_contact_phone || null]
      );
    }

    // Upsert medical history.
    await client.query(
      `INSERT INTO "MedicalHistory" (
        id, user_id,
        pregnant_or_breastfeeding, blood_borne_conditions, diabetes, heart_condition,
        haemophilia_or_bleeding_disorder, epilepsy_or_seizure, skin_conditions,
        autoimmune_conditions, blood_thinners, steroids_or_immunosuppressants,
        alcohol_or_drugs_last_24h, known_allergies, allergies_latex, allergies_ink,
        allergies_topical_anaesthetics, previous_tattoo_reaction, previous_reaction_details,
        chemotherapy_or_radiotherapy, current_medications, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        pregnant_or_breastfeeding = EXCLUDED.pregnant_or_breastfeeding,
        blood_borne_conditions = EXCLUDED.blood_borne_conditions,
        diabetes = EXCLUDED.diabetes,
        heart_condition = EXCLUDED.heart_condition,
        haemophilia_or_bleeding_disorder = EXCLUDED.haemophilia_or_bleeding_disorder,
        epilepsy_or_seizure = EXCLUDED.epilepsy_or_seizure,
        skin_conditions = EXCLUDED.skin_conditions,
        autoimmune_conditions = EXCLUDED.autoimmune_conditions,
        blood_thinners = EXCLUDED.blood_thinners,
        steroids_or_immunosuppressants = EXCLUDED.steroids_or_immunosuppressants,
        alcohol_or_drugs_last_24h = EXCLUDED.alcohol_or_drugs_last_24h,
        known_allergies = EXCLUDED.known_allergies,
        allergies_latex = EXCLUDED.allergies_latex,
        allergies_ink = EXCLUDED.allergies_ink,
        allergies_topical_anaesthetics = EXCLUDED.allergies_topical_anaesthetics,
        previous_tattoo_reaction = EXCLUDED.previous_tattoo_reaction,
        previous_reaction_details = EXCLUDED.previous_reaction_details,
        chemotherapy_or_radiotherapy = EXCLUDED.chemotherapy_or_radiotherapy,
        current_medications = EXCLUDED.current_medications,
        updated_at = NOW()`,
      [
        randomUUID(), userId,
        !!medical.pregnant_or_breastfeeding, !!medical.blood_borne_conditions, !!medical.diabetes,
        !!medical.heart_condition, !!medical.haemophilia_or_bleeding_disorder, !!medical.epilepsy_or_seizure,
        medical.skin_conditions || null, !!medical.autoimmune_conditions, !!medical.blood_thinners,
        !!medical.steroids_or_immunosuppressants, !!medical.alcohol_or_drugs_last_24h,
        medical.known_allergies || null, !!medical.allergies_latex, !!medical.allergies_ink,
        !!medical.allergies_topical_anaesthetics, !!medical.previous_tattoo_reaction,
        medical.previous_reaction_details || null, !!medical.chemotherapy_or_radiotherapy,
        medical.current_medications || null,
      ]
    );

    // Create the walk-in Booking and capture the allocated reference.
    const bookingId = randomUUID();
    const bookingReference = await allocateBookingReference(client, true, async (ref) => {
      await client.query(
        `INSERT INTO "Booking" (
          id, studio_id, user_id, artist_id, appointment_date_time,
          appointment_status, tattoo_description, placement, estimated_size,
          deposit_amount, balance_due, booking_reference, payment_method,
          created_at, updated_at
        ) VALUES ($1, $2, $3, NULL, NOW(), 'walk_in', $4, $5, $6, '0', '0', $7, 'in_studio', NOW(), NOW())`,
        [bookingId, 'default-studio', userId, tattoo_description || 'Walk-in tattoo', placement,
         req.body.estimated_size || 'small', ref]
      );
    });

    // Upload ID proof to Supabase storage.
    let idProofUrl: string | null = null;
    try {
      idProofUrl = await uploadToSupabase(file.buffer, file.originalname, file.mimetype, 'design-ideas');
    } catch (uploadErr) {
      console.error('[consent walk-in] ID proof upload failed:', uploadErr);
      // Roll back the booking — we won't accept a consent record without the ID we required.
      await client.query(`DELETE FROM "Booking" WHERE id = $1`, [bookingId]);
      return res.status(500).json({ success: false, error: 'ID proof upload failed. Please try again.' });
    }

    // Create the consent form row.
    const formId = randomUUID();
    const formRef = `CF-${bookingReference}`;
    const now = new Date();
    await client.query(
      `INSERT INTO "ConsentForm" (
        id, user_id, booking_id, form_reference_no, full_name_signed, date_signed,
        age_confirmed, health_accuracy_confirmed, risks_understood_confirmed, sobriety_confirmed,
        suitability_confirmed, voluntary_consent_confirmed, design_approved_confirmed,
        aftercare_responsibility_confirmed, photography_permission, gdpr_consent_confirmed,
        form_status, is_walk_in, id_proof_url, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        true, true, true, true, true, true, true, true, $7, true,
        'signed', true, $8, NOW(), NOW()
      )`,
      [formId, userId, bookingId, formRef, fullNameSigned, now,
       !!consent.photography_permission, idProofUrl]
    );

    // Fire the PDF + emails (best-effort).
    try {
      const dateStr = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }).format(now);
      const signedStr = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(now);

      const pdfBuffer = await generateConsentFormPDF({
        clientName: `${first_name} ${last_name}`,
        clientEmail: email,
        clientPhone: phone,
        clientAddress: [address, city, postcode].filter(Boolean).join(', '),
        bookingReference,
        appointmentDate: dateStr,
        placement,
        artistName: 'Hall of Mirrors',
        dateSigned: signedStr,
        fullNameSigned,
        medical: {
          pregnant_or_breastfeeding: !!medical.pregnant_or_breastfeeding,
          blood_borne_conditions: !!medical.blood_borne_conditions,
          diabetes: !!medical.diabetes,
          heart_condition: !!medical.heart_condition,
          haemophilia_or_bleeding_disorder: !!medical.haemophilia_or_bleeding_disorder,
          epilepsy_or_seizure: !!medical.epilepsy_or_seizure,
          skin_conditions: (medical.skin_conditions as string) || '',
          autoimmune_conditions: !!medical.autoimmune_conditions,
          blood_thinners: !!medical.blood_thinners,
          steroids_or_immunosuppressants: !!medical.steroids_or_immunosuppressants,
          alcohol_or_drugs_last_24h: !!medical.alcohol_or_drugs_last_24h,
          known_allergies: (medical.known_allergies as string) || '',
          allergies_latex: !!medical.allergies_latex,
          allergies_ink: !!medical.allergies_ink,
          allergies_topical_anaesthetics: !!medical.allergies_topical_anaesthetics,
          previous_tattoo_reaction: !!medical.previous_tattoo_reaction,
          previous_reaction_details: (medical.previous_reaction_details as string) || '',
          chemotherapy_or_radiotherapy: !!medical.chemotherapy_or_radiotherapy,
          current_medications: (medical.current_medications as string) || '',
        },
        consent: {
          age_confirmed: true,
          health_accuracy_confirmed: true,
          risks_understood_confirmed: true,
          sobriety_confirmed: true,
          suitability_confirmed: true,
          voluntary_consent_confirmed: true,
          design_approved_confirmed: true,
          aftercare_responsibility_confirmed: true,
          photography_permission: !!consent.photography_permission,
          gdpr_consent_confirmed: true,
        },
      });
      const pdfBase64 = pdfBuffer.toString('base64');

      sendConsentFormToClient({
        clientEmail: email,
        clientName: `${first_name} ${last_name}`,
        bookingReference,
        formReference: formRef,
        pdfBase64,
      }).catch((e) => console.error('[email] walk-in consent client email failed:', e));

      sendConsentFormToStudio({
        clientName: `${first_name} ${last_name}`,
        clientEmail: email,
        bookingReference,
        formReference: formRef,
        pdfBase64,
      }).catch((e) => console.error('[email] walk-in consent studio email failed:', e));
    } catch (pdfErr) {
      console.error('[pdf] walk-in generation failed (non-fatal):', pdfErr);
    }

    res.json({
      success: true,
      formReference: formRef,
      bookingReference,
      message: 'Consent form submitted. Thank you.',
    });
  } catch (error) {
    console.error('Submit walk-in consent error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit consent form' });
  } finally {
    await client.end();
  }
}
