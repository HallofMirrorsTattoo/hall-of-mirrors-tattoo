// One-shot generator for the printable in-shop consent poster.
//
// Produces an A4 portrait PDF at:
//   frontend/public/walk-in-consent-poster.pdf
//
// Run from the backend/ directory:
//   node scripts/generate-consent-poster.mjs
//
// The poster is intentionally ink-light: white paper, pure-black ink, no
// filled backgrounds or gradients. Brand expression comes from the typography
// (Cormorant Garamond italic + DM Mono) and a hairline divider.

import PDFDocument from 'pdfkit';
import { createWriteStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, '..', '..');

const FONTS_DIR  = path.join(REPO_ROOT, 'backend', 'src', 'assets', 'fonts');
// 512×512 black mark on transparent. The /assets/logos/HOMLOGO.png source is
// >20MB raw, which would balloon the poster PDF; this favicon-sized copy of
// the same mark prints crisply on A4 at the 90pt size we use here.
const LOGO_PATH  = path.join(REPO_ROOT, 'frontend', 'app', 'icon.png');
const QR_PATH    = path.join(REPO_ROOT, 'frontend', 'public', 'consent-qr.png');
const OUT_PATH   = path.join(REPO_ROOT, 'frontend', 'public', 'walk-in-consent-poster.pdf');

for (const required of [LOGO_PATH, QR_PATH, FONTS_DIR]) {
  if (!existsSync(required)) {
    console.error('Missing required asset:', required);
    process.exit(1);
  }
}

const FONT = {
  serifItalic: path.join(FONTS_DIR, 'CormorantGaramond-Italic-VF.ttf'),
  serifReg:    path.join(FONTS_DIR, 'CormorantGaramond-VF.ttf'),
  sans:        path.join(FONTS_DIR, 'DMSans-VF.ttf'),
  mono:        path.join(FONTS_DIR, 'DMMono-Regular.ttf'),
  monoMed:     path.join(FONTS_DIR, 'DMMono-Medium.ttf'),
};

const INK = '#000000';
const HAIRLINE = '#000000';

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 56;

// Bottom margin is held tighter than `MARGIN` so the visual footer (anchored
// near the page bottom by absolute Y) doesn't trip PDFKit's auto-pagination
// guard. Top/left/right keep the editorial breathing room of the poster.
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: MARGIN, bottom: 16, left: MARGIN, right: MARGIN },
  info: {
    Title: 'Hall of Mirrors — Walk-in Consent QR',
    Author: 'Hall of Mirrors Tattoo Studio',
    Subject: 'Scan to fill in your consent form',
  },
});
doc.pipe(createWriteStream(OUT_PATH));

// Register fonts
for (const [key, p] of Object.entries(FONT)) {
  doc.registerFont(key, p);
}

const pageWidth  = doc.page.width;
const pageRight  = pageWidth - MARGIN;
const contentW   = pageRight - MARGIN;

// ── Logo mark ────────────────────────────────────────────────────────────────
const logoSize = 78;
const logoX = (pageWidth - logoSize) / 2;
doc.image(LOGO_PATH, logoX, MARGIN, { width: logoSize, height: logoSize });

// ── Wordmark (typographic, not raster) ───────────────────────────────────────
let y = MARGIN + logoSize + 14;
doc.fillColor(INK).font('serifItalic').fontSize(36)
  .text('Hall of Mirrors', MARGIN, y, { width: contentW, align: 'center' });
y = doc.y + 4;
doc.fillColor(INK).font('mono').fontSize(8.5)
  .text('TATTOO STUDIO  ·  LIVERPOOL', MARGIN, y, {
    width: contentW, align: 'center', characterSpacing: 3.4,
  });
y = doc.y + 16;

// Centred hairline divider (~ 50pt wide)
const centerX = pageWidth / 2;
doc.save().strokeColor(HAIRLINE).lineWidth(0.7)
  .moveTo(centerX - 25, y).lineTo(centerX + 25, y).stroke().restore();
y += 28;

// ── Title block ──────────────────────────────────────────────────────────────
doc.fillColor(INK).font('serifItalic').fontSize(52)
  .text('Consent form', MARGIN, y, { width: contentW, align: 'center' });
y = doc.y + 14;

doc.fillColor(INK).font('sans').fontSize(12)
  .text('Scan the code to fill in your consent form online.',
    MARGIN, y, { width: contentW, align: 'center', lineGap: 4 });
y = doc.y + 24;

// ── QR code ──────────────────────────────────────────────────────────────────
const qrSize = 230;
const qrX = (pageWidth - qrSize) / 2;
const qrY = y;
const framePad = 12;
doc.save().strokeColor(HAIRLINE).lineWidth(0.7)
  .rect(qrX - framePad, qrY - framePad, qrSize + framePad * 2, qrSize + framePad * 2)
  .stroke().restore();
doc.image(QR_PATH, qrX, qrY, { width: qrSize, height: qrSize });
y = qrY + qrSize + framePad + 20;

// ── Fallback URL ────────────────────────────────────────────────────────────
doc.fillColor(INK).font('mono').fontSize(9)
  .text('OR VISIT', MARGIN, y, { width: contentW, align: 'center', characterSpacing: 3.2 });
y = doc.y + 4;
doc.fillColor(INK).font('monoMed').fontSize(12)
  .text('hallofmirrorstattoo.com/consent', MARGIN, y, {
    width: contentW, align: 'center', characterSpacing: 1.4,
  });

// ── Footer ──────────────────────────────────────────────────────────────────
// Drawn with explicit lineBreak:false so the absolute positioning doesn't
// trigger PDFKit's auto-pagination when doc.y is already past the bottom.
const footerY = A4_H - MARGIN - 30;
doc.save().strokeColor(HAIRLINE).lineWidth(0.4).opacity(0.45)
  .moveTo(MARGIN, footerY).lineTo(pageRight, footerY).stroke().restore();
doc.opacity(1);
doc.y = footerY + 9;
doc.fillColor(INK).font('mono').fontSize(7.5)
  .text('SUITE 3  ·  34 CASTLE STREET  ·  LIVERPOOL L2 0NR',
    MARGIN, footerY + 9, { width: contentW, align: 'center', characterSpacing: 2.0, lineBreak: false });
doc.fillColor(INK).font('sans').fontSize(8)
  .text('Fully licensed by Liverpool City Council.',
    MARGIN, footerY + 21, { width: contentW, align: 'center', lineBreak: false });

doc.end();

await new Promise((resolve) => doc.on('end', resolve));
console.log('Wrote', OUT_PATH);
