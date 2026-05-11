import PDFDocument from 'pdfkit';

interface ConsentPDFData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  bookingReference: string;
  appointmentDate: string;
  placement: string;
  artistName: string;
  dateSigned: string;
  fullNameSigned: string;
  medical: {
    pregnant_or_breastfeeding: boolean;
    blood_borne_conditions: boolean;
    diabetes: boolean;
    heart_condition: boolean;
    haemophilia_or_bleeding_disorder: boolean;
    epilepsy_or_seizure: boolean;
    skin_conditions: string;
    autoimmune_conditions: boolean;
    blood_thinners: boolean;
    steroids_or_immunosuppressants: boolean;
    alcohol_or_drugs_last_24h: boolean;
    known_allergies: string;
    allergies_latex: boolean;
    allergies_ink: boolean;
    allergies_topical_anaesthetics: boolean;
    previous_tattoo_reaction: boolean;
    previous_reaction_details: string;
    chemotherapy_or_radiotherapy: boolean;
    current_medications: string;
  };
  consent: {
    age_confirmed: boolean;
    health_accuracy_confirmed: boolean;
    risks_understood_confirmed: boolean;
    sobriety_confirmed: boolean;
    suitability_confirmed: boolean;
    voluntary_consent_confirmed: boolean;
    design_approved_confirmed: boolean;
    aftercare_responsibility_confirmed: boolean;
    photography_permission: boolean;
    gdpr_consent_confirmed: boolean;
  };
}

export function generateConsentFormPDF(data: ConsentPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const gold = '#C9A84C';
    const dark = '#1A1714';
    const mid = '#6B6358';

    // Header bar
    doc.rect(0, 0, doc.page.width, 80).fill(dark);
    doc.fillColor(gold).font('Helvetica-Oblique').fontSize(20)
      .text('Hall of Mirrors Tattoo', 50, 22, { align: 'center' });
    doc.fillColor('#AAAAAA').font('Helvetica').fontSize(9)
      .text('CLIENT CONSENT FORM', 50, 48, { align: 'center' });

    let y = 100;

    // Booking details box
    doc.rect(50, y, doc.page.width - 100, 80).stroke(gold);
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(8)
      .text('APPOINTMENT DETAILS', 62, y + 10);
    doc.fillColor(dark).font('Helvetica').fontSize(10);
    doc.text(`Reference: ${data.bookingReference}`, 62, y + 26);
    doc.text(`Date: ${data.appointmentDate}`, 62, y + 42);
    doc.text(`Placement: ${data.placement}`, 62, y + 58);
    doc.text(`Artist: ${data.artistName}`, 310, y + 26);
    doc.text(`Form signed: ${data.dateSigned}`, 310, y + 42);
    y += 98;

    // Client details
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(8).text('CLIENT DETAILS', 50, y);
    y += 16;
    doc.fillColor(dark).font('Helvetica').fontSize(10);
    doc.text(`Name: ${data.clientName}`, 50, y);
    doc.text(`Email: ${data.clientEmail}`, 50, y + 16);
    doc.text(`Phone: ${data.clientPhone}`, 310, y);
    doc.text(`Address: ${data.clientAddress}`, 310, y + 16);
    y += 40;

    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke(gold);
    y += 14;

    // Medical history
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(8).text('MEDICAL HISTORY', 50, y);
    y += 16;

    const boolRow = (label: string, val: boolean) => {
      doc.fillColor(dark).font('Helvetica').fontSize(9.5)
        .text(label, 50, y, { width: 360 });
      doc.fillColor(val ? '#c0392b' : '#27ae60').font('Helvetica-Bold').fontSize(9.5)
        .text(val ? 'YES' : 'No', 420, y);
      doc.fillColor(dark).font('Helvetica');
      y += 16;
    };

    const textRow = (label: string, val: string) => {
      if (!val) return;
      doc.fillColor(mid).font('Helvetica').fontSize(9)
        .text(`${label}: ${val}`, 50, y, { width: doc.page.width - 100 });
      y += 14;
    };

    boolRow('Pregnant or breastfeeding', data.medical.pregnant_or_breastfeeding);
    boolRow('Blood-borne conditions (HIV, Hepatitis B/C)', data.medical.blood_borne_conditions);
    boolRow('Diabetes', data.medical.diabetes);
    boolRow('Heart condition or pacemaker', data.medical.heart_condition);
    boolRow('Haemophilia or bleeding disorder', data.medical.haemophilia_or_bleeding_disorder);
    boolRow('Epilepsy or seizure disorder', data.medical.epilepsy_or_seizure);
    boolRow('Autoimmune conditions', data.medical.autoimmune_conditions);
    boolRow('Currently taking blood thinners', data.medical.blood_thinners);
    boolRow('Steroids or immunosuppressants', data.medical.steroids_or_immunosuppressants);
    boolRow('Alcohol or drugs in last 24 hours', data.medical.alcohol_or_drugs_last_24h);
    boolRow('Currently undergoing chemotherapy / radiotherapy', data.medical.chemotherapy_or_radiotherapy);
    boolRow('Previous tattoo reaction', data.medical.previous_tattoo_reaction);
    boolRow('Latex allergy', data.medical.allergies_latex);
    boolRow('Ink allergy', data.medical.allergies_ink);
    boolRow('Topical anaesthetic allergy', data.medical.allergies_topical_anaesthetics);
    textRow('Skin conditions', data.medical.skin_conditions);
    textRow('Known allergies', data.medical.known_allergies);
    textRow('Previous reaction details', data.medical.previous_reaction_details);
    textRow('Current medications', data.medical.current_medications);

    y += 6;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke(gold);
    y += 14;

    // Consent declarations
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(8).text('CONSENT DECLARATIONS', 50, y);
    y += 16;

    const checkRow = (statement: string, checked: boolean) => {
      doc.fillColor(checked ? dark : '#c0392b').font('Helvetica').fontSize(9.5)
        .text(`${checked ? '✓' : '✗'}  ${statement}`, 50, y, { width: doc.page.width - 100 });
      y += 16;
    };

    checkRow('I confirm I am 18 years of age or older.', data.consent.age_confirmed);
    checkRow('The health information provided above is accurate and complete.', data.consent.health_accuracy_confirmed);
    checkRow('I understand the risks associated with tattooing (scarring, infection, fading).', data.consent.risks_understood_confirmed);
    checkRow('I have not consumed alcohol or drugs in the last 24 hours.', data.consent.sobriety_confirmed);
    checkRow('I confirm there are no active skin conditions on the placement area.', data.consent.suitability_confirmed);
    checkRow('I am giving my voluntary and informed consent to be tattooed.', data.consent.voluntary_consent_confirmed);
    checkRow('I have approved the design to be tattooed.', data.consent.design_approved_confirmed);
    checkRow('I accept responsibility for following the aftercare instructions provided.', data.consent.aftercare_responsibility_confirmed);
    checkRow('I give permission for photographs to be taken for portfolio use.', data.consent.photography_permission);
    checkRow('I consent to my personal data being stored securely by Hall of Mirrors Tattoo.', data.consent.gdpr_consent_confirmed);

    y += 10;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke(gold);
    y += 18;

    // Signature
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(8).text('ELECTRONIC SIGNATURE', 50, y);
    y += 18;
    doc.fillColor(dark).font('Helvetica-Oblique').fontSize(15).text(data.fullNameSigned, 50, y);
    y += 20;
    doc.fillColor(mid).font('Helvetica').fontSize(9)
      .text(`Signed electronically on ${data.dateSigned}`, 50, y);

    // Footer
    const footerY = doc.page.height - 50;
    doc.moveTo(50, footerY - 12).lineTo(doc.page.width - 50, footerY - 12).stroke('#DDDDDD');
    doc.fillColor(mid).font('Helvetica').fontSize(8)
      .text('Suite 3 · 34 Castle Street · Liverpool L2 0NR · studio@hallofmirrorstattoo.com', 50, footerY - 6, { align: 'center' });
    doc.text('This document is held securely on file.', 50, footerY + 6, { align: 'center' });

    doc.end();
  });
}
