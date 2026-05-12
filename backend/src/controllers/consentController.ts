import { Request, Response } from 'express';
import pkg from 'pg';
import { generateConsentFormPDF } from '../services/pdfService.js';
import { sendConsentFormToClient, sendConsentFormToStudio } from '../services/emailService.js';

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
              a.full_name as artist_name
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

    const formId = crypto.randomUUID();
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
        crypto.randomUUID(), req.user.id,
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

    // Get all bookings for this user — also match by email (stub-user fallback)
    const result = await client.query(
      `SELECT b.id as booking_id, b.booking_reference, b.appointment_date_time,
              b.placement, b.appointment_status, b.estimated_size,
              a.full_name as artist_name,
              cf.id as consent_form_id, cf.form_reference_no, cf.form_status, cf.date_signed
       FROM "Booking" b
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       LEFT JOIN "ConsentForm" cf ON cf.booking_id = b.id
       LEFT JOIN "User" u ON b.user_id = u.id
       WHERE b.user_id = $1 OR u.email = $2
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
