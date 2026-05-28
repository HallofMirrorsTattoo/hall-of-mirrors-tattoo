import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// ── Brand theme ─────────────────────────────────────────────────────────────
// Mirrors the email/site palette as closely as the printed page allows. We
// deliberately use a paper-friendly variant rather than the full dark theme:
// printing the dark email design would be wasteful on ink and visually
// arrogant in a regulator's filing cabinet. Brand expression comes from the
// gold accents and the Cormorant / DM Sans typography instead.
const THEME = {
  paper:        '#FFFFFF',
  ink:          '#1A1714', // primary text — warm near-black, matches site --surface
  inkSoft:      '#3A332B',
  secondary:    '#6B6358', // labels, captions
  gold:         '#C9A84C',
  goldSoft:     '#B89538',
  rule:         '#E2DAC8', // hairline divider, paper-tone
  ruleDeep:     '#C9A84C',
  yesFill:      '#C9A84C',
  noOutline:    '#C9C2B4',
} as const;

// ── Embedded fonts ──────────────────────────────────────────────────────────
// PDFKit needs concrete file paths to embed TrueType fonts. When the package
// is compiled the source `src` becomes `dist`, so we resolve relative to the
// *running file* and fall through compiled & source locations. If none of the
// font files are available (e.g. fresh deploy that hasn't synced assets yet)
// PDFKit's built-in PostScript fonts are used as a graceful fallback so the
// PDF still renders without crashing the consent flow.
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

function resolveFontPath(filename: string): string | null {
  // Try the most-likely-to-be-correct paths first. Covers:
  //   1. ts-node dev:        src/services/pdfService.ts  → ../assets/fonts
  //   2. compiled prod:      dist/services/pdfService.js → ../assets/fonts (after build copies src/assets → dist/assets)
  //   3. compiled prod alt:  ../../src/assets/fonts        (if source is still on disk next to dist)
  //   4. CWD-relative:       useful when started from the backend/ root
  const candidates = [
    path.resolve(__dirname, '../assets/fonts', filename),
    path.resolve(__dirname, '../../src/assets/fonts', filename),
    path.resolve(__dirname, '../../assets/fonts', filename),
    path.resolve(process.cwd(), 'src/assets/fonts', filename),
    path.resolve(process.cwd(), 'dist/assets/fonts', filename),
    path.resolve(process.cwd(), 'backend/src/assets/fonts', filename),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

// Font keys used through the document. Falling back to PDFKit's built-in
// PostScript names if the TTF can't be located.
const FONT_FILES: Record<string, { ttf: string; fallback: string }> = {
  serifItalic: { ttf: 'CormorantGaramond-Italic-VF.ttf', fallback: 'Times-Italic' },
  serifReg:    { ttf: 'CormorantGaramond-VF.ttf',        fallback: 'Times-Roman'  },
  sans:        { ttf: 'DMSans-VF.ttf',                   fallback: 'Helvetica'    },
  sansMed:     { ttf: 'DMSans-VF.ttf',                   fallback: 'Helvetica-Bold' },
  mono:        { ttf: 'DMMono-Regular.ttf',              fallback: 'Courier'      },
  monoMed:     { ttf: 'DMMono-Medium.ttf',               fallback: 'Courier-Bold' },
};

// ── Types ───────────────────────────────────────────────────────────────────
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
  formReference?: string;
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

// ── Renderer ────────────────────────────────────────────────────────────────
export function generateConsentFormPDF(data: ConsentPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const MARGIN_X = 56;
    const MARGIN_Y = 64;
    const doc = new PDFDocument({ size: 'A4', margins: { top: MARGIN_Y, bottom: MARGIN_Y, left: MARGIN_X, right: MARGIN_X } });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Register fonts (or alias the built-in fallback under the same key)
    for (const [key, { ttf, fallback }] of Object.entries(FONT_FILES)) {
      const filePath = resolveFontPath(ttf);
      if (filePath) {
        try { doc.registerFont(key, filePath); }
        catch { doc.registerFont(key, fallback); }
      } else {
        doc.registerFont(key, fallback);
      }
    }

    const pageWidth = doc.page.width;
    const pageRight = pageWidth - MARGIN_X;
    const contentWidth = pageRight - MARGIN_X;

    const setFill = (c: string) => doc.fillColor(c);

    // Gold rule helper
    const goldRule = (yPos: number, color = THEME.gold, opacity = 0.4) => {
      doc.save().opacity(opacity).strokeColor(color).lineWidth(0.6)
        .moveTo(MARGIN_X, yPos).lineTo(pageRight, yPos).stroke().restore();
    };

    // Page-break guard: if drawing `needed` more pts would cross the bottom
    // margin, start a new page and re-draw a minimal header.
    const ensureSpace = (needed: number) => {
      const bottomLimit = doc.page.height - MARGIN_Y;
      if (doc.y + needed > bottomLimit) {
        doc.addPage();
        drawContinuationHeader();
      }
    };

    const drawContinuationHeader = () => {
      doc.font('mono').fontSize(8).fillColor(THEME.gold)
        .text(`HALL OF MIRRORS  ·  CONSENT  ·  ${data.bookingReference}`, MARGIN_X, MARGIN_Y - 22,
          { width: contentWidth, align: 'left', characterSpacing: 1.2 });
      goldRule(MARGIN_Y - 6, THEME.gold, 0.25);
      doc.y = MARGIN_Y;
    };

    // ── Top accent stripe ────────────────────────────────────────────────
    doc.save().rect(0, 0, pageWidth, 8).fill(THEME.gold).restore();

    doc.y = MARGIN_Y;

    // ── Brand mark ────────────────────────────────────────────────────────
    setFill(THEME.ink).font('serifItalic').fontSize(34)
      .text('Hall of Mirrors', MARGIN_X, doc.y, { width: contentWidth, align: 'center', lineGap: -4 });

    setFill(THEME.gold).font('mono').fontSize(8)
      .text('TATTOO STUDIO  ·  LIVERPOOL', MARGIN_X, doc.y + 4, {
        width: contentWidth, align: 'center', characterSpacing: 3,
      });

    // Decorative centred hairline
    const ruleY = doc.y + 18;
    doc.save().strokeColor(THEME.gold).lineWidth(0.8).opacity(0.5)
      .moveTo(pageWidth / 2 - 24, ruleY).lineTo(pageWidth / 2 + 24, ruleY).stroke().restore();
    doc.y = ruleY + 22;

    // ── Title block ───────────────────────────────────────────────────────
    setFill(THEME.gold).font('mono').fontSize(8)
      .text(`CONSENT FORM  ·  ${data.formReference ?? data.bookingReference}`, MARGIN_X, doc.y, {
        width: contentWidth, align: 'center', characterSpacing: 2.4,
      });

    setFill(THEME.ink).font('serifItalic').fontSize(26)
      .text('Client consent record', MARGIN_X, doc.y + 8, {
        width: contentWidth, align: 'center',
      });
    doc.y += 18;

    // ── Section helper ────────────────────────────────────────────────────
    const section = (label: string) => {
      ensureSpace(46);
      doc.y += 8;
      setFill(THEME.gold).font('mono').fontSize(8)
        .text(label.toUpperCase(), MARGIN_X, doc.y, { characterSpacing: 2.4 });
      doc.y += 4;
      goldRule(doc.y + 4, THEME.gold, 0.35);
      doc.y += 14;
    };

    // Two-column key/value row used by Booking + Client blocks.
    const colA = MARGIN_X;
    const colB = MARGIN_X + contentWidth / 2 + 6;
    const colW = contentWidth / 2 - 6;

    const keyValue = (col: number, label: string, value: string | null | undefined, baseY: number): number => {
      setFill(THEME.gold).opacity(0.7).font('mono').fontSize(7)
        .text(label.toUpperCase(), col, baseY, { characterSpacing: 1.6, width: colW });
      doc.opacity(1);
      setFill(THEME.ink).font('sans').fontSize(11)
        .text(value && value !== '' ? value : '—', col, baseY + 11, { width: colW });
      return doc.y; // PDFKit advances doc.y as it renders
    };

    // Yes/no medical row — soft gold filled circle for yes, hollow ring for no.
    const medicalRow = (label: string, val: boolean) => {
      ensureSpace(22);
      const rowY = doc.y;
      setFill(THEME.ink).font('sans').fontSize(10.5)
        .text(label, MARGIN_X, rowY, { width: contentWidth - 76, lineGap: 1.2 });
      const labelBottom = doc.y;

      // Indicator dot on the right edge
      const dotR = 4;
      const dotCx = pageRight - 12;
      const dotCy = rowY + 7;
      doc.save();
      if (val) {
        doc.circle(dotCx, dotCy, dotR).fillColor(THEME.yesFill).fill();
      } else {
        doc.circle(dotCx, dotCy, dotR).strokeColor(THEME.noOutline).lineWidth(0.8).stroke();
      }
      doc.restore();

      // Yes/No label beside dot
      setFill(val ? THEME.gold : THEME.secondary).font('mono').fontSize(7)
        .text(val ? 'YES' : 'NO', dotCx - 44, rowY + 4, { characterSpacing: 1.4, width: 28, align: 'right' });

      doc.y = Math.max(labelBottom + 4, rowY + 18);
      doc.save().strokeColor(THEME.rule).opacity(0.6).lineWidth(0.4)
        .moveTo(MARGIN_X, doc.y).lineTo(pageRight, doc.y).stroke().restore();
      doc.y += 6;
    };

    const noteRow = (label: string, val: string) => {
      if (!val || val.trim() === '') return;
      ensureSpace(40);
      setFill(THEME.gold).opacity(0.7).font('mono').fontSize(7)
        .text(label.toUpperCase(), MARGIN_X, doc.y, { characterSpacing: 1.6 });
      doc.opacity(1);
      doc.y += 12;
      setFill(THEME.inkSoft).font('sans').fontSize(10.5)
        .text(val, MARGIN_X, doc.y, { width: contentWidth, lineGap: 2 });
      doc.y += 8;
    };

    const consentRow = (statement: string, checked: boolean) => {
      ensureSpace(28);
      const rowY = doc.y;
      const boxSize = 11;
      const boxX = MARGIN_X;
      const boxY = rowY + 2;

      doc.save();
      if (checked) {
        doc.roundedRect(boxX, boxY, boxSize, boxSize, 2).fillColor(THEME.gold).fill();
        // Checkmark — drawn as two lines for crispness
        doc.strokeColor(THEME.paper).lineWidth(1.4)
          .moveTo(boxX + 2.6, boxY + 5.8)
          .lineTo(boxX + 4.8, boxY + 8.2)
          .lineTo(boxX + 8.4, boxY + 3.4)
          .stroke();
      } else {
        doc.roundedRect(boxX, boxY, boxSize, boxSize, 2).strokeColor(THEME.rule).lineWidth(0.8).stroke();
      }
      doc.restore();

      setFill(checked ? THEME.ink : THEME.secondary)
        .font('sans').fontSize(10.5)
        .text(statement, boxX + boxSize + 12, rowY, {
          width: contentWidth - boxSize - 12,
          lineGap: 1.4,
        });
      doc.y += 6;
    };

    // ── Booking details ──────────────────────────────────────────────────
    section('Booking details');
    {
      const startY = doc.y;
      keyValue(colA, 'Reference', data.bookingReference, startY);
      const leftEndA = doc.y;
      keyValue(colB, 'Date', data.appointmentDate, startY);
      doc.y = Math.max(leftEndA, doc.y) + 10;

      const yRow2 = doc.y;
      keyValue(colA, 'Placement', data.placement, yRow2);
      const leftEndB = doc.y;
      keyValue(colB, 'Artist', data.artistName, yRow2);
      doc.y = Math.max(leftEndB, doc.y) + 10;

      const yRow3 = doc.y;
      keyValue(colA, 'Form signed', data.dateSigned, yRow3);
      doc.y += 18;
    }

    // ── Client ───────────────────────────────────────────────────────────
    section('Client');
    {
      const yRow1 = doc.y;
      keyValue(colA, 'Name', data.clientName, yRow1);
      const leftEndA = doc.y;
      keyValue(colB, 'Email', data.clientEmail, yRow1);
      doc.y = Math.max(leftEndA, doc.y) + 10;

      const yRow2 = doc.y;
      keyValue(colA, 'Phone', data.clientPhone, yRow2);
      const leftEndB = doc.y;
      keyValue(colB, 'Address', data.clientAddress, yRow2);
      doc.y = Math.max(leftEndB, doc.y) + 18;
    }

    // ── Medical history ──────────────────────────────────────────────────
    section('Health information');
    medicalRow('Pregnant or breastfeeding', data.medical.pregnant_or_breastfeeding);
    medicalRow('Blood-borne conditions (HIV, Hepatitis B or C)', data.medical.blood_borne_conditions);
    medicalRow('Diabetes', data.medical.diabetes);
    medicalRow('Heart condition or pacemaker', data.medical.heart_condition);
    medicalRow('Haemophilia or bleeding disorder', data.medical.haemophilia_or_bleeding_disorder);
    medicalRow('Epilepsy or seizure disorder', data.medical.epilepsy_or_seizure);
    medicalRow('Autoimmune conditions', data.medical.autoimmune_conditions);
    medicalRow('Currently taking blood thinners', data.medical.blood_thinners);
    medicalRow('Steroids or immunosuppressants', data.medical.steroids_or_immunosuppressants);
    medicalRow('Alcohol or drugs in last 24 hours', data.medical.alcohol_or_drugs_last_24h);
    medicalRow('Currently undergoing chemotherapy or radiotherapy', data.medical.chemotherapy_or_radiotherapy);
    medicalRow('Previous reaction to a tattoo', data.medical.previous_tattoo_reaction);
    medicalRow('Latex allergy', data.medical.allergies_latex);
    medicalRow('Ink or pigment allergy', data.medical.allergies_ink);
    medicalRow('Topical anaesthetic allergy', data.medical.allergies_topical_anaesthetics);

    doc.y += 6;
    noteRow('Skin conditions', data.medical.skin_conditions);
    noteRow('Known allergies', data.medical.known_allergies);
    noteRow('Previous reaction details', data.medical.previous_reaction_details);
    noteRow('Current medications', data.medical.current_medications);

    // ── Consent declarations ─────────────────────────────────────────────
    section('Consent declarations');
    consentRow('I confirm I am 18 years of age or older.', data.consent.age_confirmed);
    consentRow('The health information provided above is accurate and complete.', data.consent.health_accuracy_confirmed);
    consentRow('I understand the risks of tattooing (including infection, allergic reaction, scarring, and pain).', data.consent.risks_understood_confirmed);
    consentRow('I have not consumed alcohol or drugs in the last 24 hours.', data.consent.sobriety_confirmed);
    consentRow('I confirm there are no active skin conditions, open wounds, or sunburn on the placement area.', data.consent.suitability_confirmed);
    consentRow('I am voluntarily consenting to be tattooed and have not been coerced.', data.consent.voluntary_consent_confirmed);
    consentRow('I have approved the design, placement, and size with my artist before the session begins.', data.consent.design_approved_confirmed);
    consentRow('I take responsibility for following the aftercare advice given by the studio.', data.consent.aftercare_responsibility_confirmed);
    consentRow('I give permission for photographs of the tattoo to be used on the studio’s website and social media.', data.consent.photography_permission);
    consentRow('I consent to my personal data being stored securely in line with UK GDPR and Liverpool City Council licensing requirements.', data.consent.gdpr_consent_confirmed);

    // ── Signature ────────────────────────────────────────────────────────
    ensureSpace(120);
    doc.y += 12;
    section('Signature');
    setFill(THEME.ink).font('serifItalic').fontSize(28)
      .text(data.fullNameSigned, MARGIN_X, doc.y, { width: contentWidth, align: 'left' });
    doc.y += 6;
    doc.save().strokeColor(THEME.gold).lineWidth(0.6).opacity(0.55)
      .moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + 220, doc.y).stroke().restore();
    doc.y += 8;
    setFill(THEME.secondary).font('mono').fontSize(8)
      .text(`SIGNED ELECTRONICALLY  ·  ${data.dateSigned.toUpperCase()}`, MARGIN_X, doc.y, { characterSpacing: 1.6 });

    // ── Footer ───────────────────────────────────────────────────────────
    const footerY = doc.page.height - MARGIN_Y + 18;
    doc.save().strokeColor(THEME.rule).lineWidth(0.4)
      .moveTo(MARGIN_X, footerY).lineTo(pageRight, footerY).stroke().restore();
    setFill(THEME.gold).opacity(0.85).font('mono').fontSize(7)
      .text('SUITE 3 · 34 CASTLE STREET · LIVERPOOL L2 0NR', MARGIN_X, footerY + 6, {
        width: contentWidth, align: 'center', characterSpacing: 1.8,
      });
    doc.opacity(1);
    setFill(THEME.secondary).font('sans').fontSize(8)
      .text('Held securely on file in accordance with Liverpool City Council tattoo studio licensing requirements.',
        MARGIN_X, footerY + 18, { width: contentWidth, align: 'center' });

    doc.end();
  });
}
