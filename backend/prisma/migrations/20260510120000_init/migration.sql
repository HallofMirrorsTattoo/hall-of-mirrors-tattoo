-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "account_status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalHistory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pregnant_or_breastfeeding" BOOLEAN NOT NULL DEFAULT false,
    "blood_borne_conditions" BOOLEAN NOT NULL DEFAULT false,
    "diabetes" BOOLEAN NOT NULL DEFAULT false,
    "heart_condition" BOOLEAN NOT NULL DEFAULT false,
    "haemophilia_or_bleeding_disorder" BOOLEAN NOT NULL DEFAULT false,
    "epilepsy_or_seizure" BOOLEAN NOT NULL DEFAULT false,
    "skin_conditions" TEXT,
    "autoimmune_conditions" BOOLEAN NOT NULL DEFAULT false,
    "blood_thinners" BOOLEAN NOT NULL DEFAULT false,
    "steroids_or_immunosuppressants" BOOLEAN NOT NULL DEFAULT false,
    "alcohol_or_drugs_last_24h" BOOLEAN NOT NULL DEFAULT false,
    "known_allergies" TEXT,
    "allergies_latex" BOOLEAN NOT NULL DEFAULT false,
    "allergies_ink" BOOLEAN NOT NULL DEFAULT false,
    "allergies_topical_anaesthetics" BOOLEAN NOT NULL DEFAULT false,
    "previous_tattoo_reaction" BOOLEAN NOT NULL DEFAULT false,
    "previous_reaction_details" TEXT,
    "chemotherapy_or_radiotherapy" BOOLEAN NOT NULL DEFAULT false,
    "current_medications" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentForm" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "booking_id" TEXT NOT NULL,
    "form_reference_no" TEXT NOT NULL,
    "full_name_signed" TEXT NOT NULL,
    "date_signed" TIMESTAMP(3) NOT NULL,
    "age_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "health_accuracy_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "risks_understood_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "sobriety_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "suitability_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "voluntary_consent_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "design_approved_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "aftercare_responsibility_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "photography_permission" BOOLEAN NOT NULL DEFAULT false,
    "gdpr_consent_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "form_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "studio_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "specialties" TEXT,
    "years_experience" INTEGER,
    "bio" TEXT,
    "instagram_handle" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'artist',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "studio_id" TEXT NOT NULL,
    "artist_id" TEXT,
    "user_id" TEXT,
    "guest_email" TEXT,
    "guest_name" TEXT,
    "guest_phone" TEXT,
    "booking_reference" TEXT NOT NULL,
    "appointment_date_time" TIMESTAMP(3) NOT NULL,
    "estimated_duration_minutes" INTEGER NOT NULL DEFAULT 120,
    "appointment_status" TEXT NOT NULL DEFAULT 'pending_consent',
    "tattoo_type" TEXT NOT NULL DEFAULT 'new_tattoo',
    "tattoo_description" TEXT,
    "placement" TEXT,
    "estimated_size" TEXT,
    "color_or_bw" TEXT,
    "artist_notes" TEXT,
    "design_approved" BOOLEAN NOT NULL DEFAULT false,
    "deposit_amount" DECIMAL(10,2) NOT NULL,
    "deposit_paid" BOOLEAN NOT NULL DEFAULT false,
    "deposit_payment_method" TEXT,
    "deposit_paid_date" TIMESTAMP(3),
    "final_price_estimate" DECIMAL(10,2),
    "final_price_paid" DECIMAL(10,2),
    "final_payment_method" TEXT,
    "balance_due" DECIMAL(10,2) NOT NULL,
    "cancellation_reason" TEXT,
    "cancellation_initiated_by" TEXT,
    "cancellation_date" TIMESTAMP(3),
    "refund_issued" BOOLEAN NOT NULL DEFAULT false,
    "refund_amount" DECIMAL(10,2),
    "client_no_show" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignIdea" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT,
    "user_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_format" TEXT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT NOT NULL,
    "description" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_date" TIMESTAMP(3),
    "auto_delete_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TattooPortfolio" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "placement" TEXT,
    "size_estimate" TEXT,
    "color_or_bw" TEXT,
    "completion_date" TIMESTAMP(3) NOT NULL,
    "portfolio_public" BOOLEAN NOT NULL DEFAULT true,
    "instagram_posted" BOOLEAN NOT NULL DEFAULT false,
    "instagram_url" TEXT,
    "client_name_credited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TattooPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactFormSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "submission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response_status" TEXT NOT NULL DEFAULT 'new',
    "responded_by" TEXT,
    "response_date" TIMESTAMP(3),
    "response_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "tattoo_idea" TEXT NOT NULL,
    "preferred_contact_method" TEXT,
    "preferred_timeframe" TEXT,
    "consultation_status" TEXT NOT NULL DEFAULT 'new',
    "assigned_to" TEXT,
    "assigned_date" TIMESTAMP(3),
    "response_date" TIMESTAMP(3),
    "response_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT,
    "artist_id" TEXT NOT NULL,
    "client_name_display" TEXT NOT NULL,
    "show_full_name" BOOLEAN NOT NULL DEFAULT false,
    "star_rating" INTEGER NOT NULL,
    "review_text" TEXT,
    "tattoo_style" TEXT,
    "tattoo_placement" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approval_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_date" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletion_reason" TEXT,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_type" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "transaction_id" TEXT,
    "stripe_charge_id" TEXT,
    "paypal_transaction_id" TEXT,
    "refund_id" TEXT,
    "refund_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Studio" (
    "id" TEXT NOT NULL,
    "studio_name" TEXT NOT NULL DEFAULT 'Hall of Mirrors Tattoo',
    "address" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "hours_monday_start" TEXT,
    "hours_monday_end" TEXT,
    "hours_tuesday_start" TEXT,
    "hours_tuesday_end" TEXT,
    "hours_wednesday_start" TEXT,
    "hours_wednesday_end" TEXT,
    "hours_thursday_start" TEXT,
    "hours_thursday_end" TEXT,
    "hours_friday_start" TEXT,
    "hours_friday_end" TEXT,
    "hours_saturday_start" TEXT,
    "hours_saturday_end" TEXT,
    "hours_sunday_start" TEXT,
    "hours_sunday_end" TEXT,
    "deposit_amount_fixed" DECIMAL(10,2),
    "deposit_percentage" DECIMAL(5,2),
    "cancellation_policy_hours" INTEGER NOT NULL DEFAULT 24,
    "about_section" TEXT,
    "instagram_handle" TEXT,
    "facebook_url" TEXT,
    "tiktok_handle" TEXT,
    "council_registration_ref" TEXT,
    "hepatitis_b_vaccination_date" TIMESTAMP(3),
    "professional_body_membership" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Studio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalHistory_user_id_key" ON "MedicalHistory"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentForm_booking_id_key" ON "ConsentForm"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentForm_form_reference_no_key" ON "ConsentForm"("form_reference_no");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_email_key" ON "Artist"("email");

-- CreateIndex
CREATE INDEX "Artist_studio_id_idx" ON "Artist"("studio_id");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_booking_reference_key" ON "Booking"("booking_reference");

-- CreateIndex
CREATE INDEX "Booking_artist_id_idx" ON "Booking"("artist_id");

-- CreateIndex
CREATE INDEX "Booking_user_id_idx" ON "Booking"("user_id");

-- CreateIndex
CREATE INDEX "TattooPortfolio_artist_id_idx" ON "TattooPortfolio"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_booking_id_key" ON "Review"("booking_id");

-- CreateIndex
CREATE INDEX "Payment_booking_id_idx" ON "Payment"("booking_id");

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentForm" ADD CONSTRAINT "ConsentForm_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentForm" ADD CONSTRAINT "ConsentForm_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignIdea" ADD CONSTRAINT "DesignIdea_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignIdea" ADD CONSTRAINT "DesignIdea_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TattooPortfolio" ADD CONSTRAINT "TattooPortfolio_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
