import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, degrees } from 'pdf-lib';
import type { ConventionDocument } from './convention';

/**
 * The convention as a PDF, from the same blocks the screen shows.
 *
 * pdf-lib with the standard Helvetica faces: pure JavaScript, no font files
 * to bundle, so it renders the same on a laptop and in a serverless function.
 * Those faces cover Windows-1252, which has every French character the text
 * uses (é, œ, ’, «, €); anything outside it is folded to its unaccented form
 * rather than crashing the render.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const NAVY = rgb(0.043, 0.122, 0.247);
const MUTED = rgb(0.35, 0.39, 0.47);
const GOLD = rgb(0.725, 0.596, 0.318);

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

function sanitizer(font: PDFFont) {
  const supported = new Set(font.getCharacterSet());
  return (text: string) =>
    Array.from(text.replace(/[  ]/g, ' '))
      .map((ch) => {
        if (ch === '\n') return ch;
        if (supported.has(ch.codePointAt(0)!)) return ch;
        const folded = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
        return folded && Array.from(folded).every((c) => supported.has(c.codePointAt(0)!)) ? folded : '?';
      })
      .join('');
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // A single token wider than the line (a hash) is cut by characters.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > width) {
        let cut = rest.length;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut -= 1;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

export async function renderConventionPdf(doc: ConventionDocument, opts: { draft: boolean }): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${doc.title} — ${doc.reference}`);
  pdf.setSubject('Séjour hôtelier contre prestation');
  pdf.setCreator('Travel Art');
  pdf.setProducer('Travel Art');
  pdf.setLanguage('fr-FR');

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };
  const clean = sanitizer(fonts.regular);
  const width = A4[0] - MARGIN * 2;

  let page: PDFPage = pdf.addPage(A4);
  let y = A4[1] - MARGIN;

  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 24) {
      page = pdf.addPage(A4);
      y = A4[1] - MARGIN;
    }
  };

  const text = (value: string, font: PDFFont, size: number, opts2: { color?: ReturnType<typeof rgb>; indent?: number; gapAfter?: number; center?: boolean } = {}) => {
    const indent = opts2.indent ?? 0;
    const lines = wrap(clean(value), font, size, width - indent);
    const lineHeight = size * 1.4;
    for (const line of lines) {
      ensure(lineHeight);
      const x = opts2.center ? MARGIN + (width - font.widthOfTextAtSize(line, size)) / 2 : MARGIN + indent;
      page.drawText(line, { x, y: y - size, size, font, color: opts2.color ?? NAVY });
      y -= lineHeight;
    }
    y -= opts2.gapAfter ?? 0;
  };

  for (const block of doc.blocks) {
    switch (block.kind) {
      case 'title':
        text(block.text, fonts.bold, 15, { center: true, gapAfter: 2 });
        break;
      case 'subtitle':
        text(block.text, fonts.italic, 11, { center: true, color: MUTED, gapAfter: 12 });
        break;
      case 'heading':
        y -= 8;
        ensure(40);
        text(block.text, fonts.bold, 11, { gapAfter: 4 });
        break;
      case 'subheading':
        y -= 4;
        ensure(30);
        text(block.text, fonts.bold, 10, { color: MUTED, gapAfter: 2 });
        break;
      case 'paragraph':
        text(block.text, block.strong ? fonts.bold : fonts.regular, 9.5, { gapAfter: 4 });
        break;
      case 'field': {
        const label = clean(`${block.label} : `);
        const size = 9.5;
        const labelWidth = fonts.bold.widthOfTextAtSize(label, size);
        if (labelWidth < width * 0.45) {
          const lines = wrap(clean(block.value), fonts.regular, size, width - labelWidth);
          ensure(size * 1.4);
          page.drawText(label, { x: MARGIN, y: y - size, size, font: fonts.bold, color: NAVY });
          lines.forEach((line, i) => {
            if (i > 0) ensure(size * 1.4);
            page.drawText(line, { x: MARGIN + labelWidth, y: y - size, size, font: fonts.regular, color: NAVY });
            y -= size * 1.4;
          });
        } else {
          text(label, fonts.bold, size);
          text(block.value, fonts.regular, size, { indent: 12 });
        }
        y -= 2;
        break;
      }
      case 'list':
        for (const item of block.items) text(`•  ${item}`, fonts.regular, 9.5, { indent: 10, gapAfter: 1 });
        y -= 3;
        break;
      case 'rule':
        y -= 6;
        ensure(10);
        page.drawLine({ start: { x: MARGIN, y }, end: { x: A4[0] - MARGIN, y }, thickness: 0.5, color: GOLD });
        y -= 10;
        break;
      case 'signature': {
        y -= 6;
        ensure(70);
        const top = y;
        text(block.label, fonts.bold, 10, { gapAfter: 2 });
        for (const line of block.lines) text(line, line.startsWith('Signé') ? fonts.italic : fonts.regular, 9.5);
        page.drawRectangle({ x: MARGIN - 6, y: y - 4, width: width + 12, height: top - y + 8, borderColor: block.signedAt ? GOLD : MUTED, borderWidth: 0.6 });
        y -= 10;
        break;
      }
    }
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const footer = clean(`Convention ${doc.reference} — page ${i + 1} / ${pages.length}`);
    p.drawText(footer, { x: MARGIN, y: MARGIN - 20, size: 8, font: fonts.regular, color: MUTED });
    if (opts.draft) {
      p.drawText(clean('PROJET — NON SIGNÉ'), {
        x: 120,
        y: 300,
        size: 54,
        font: fonts.bold,
        color: rgb(0.85, 0.82, 0.76),
        rotate: degrees(35),
        opacity: 0.35,
      });
    }
  });

  return Buffer.from(await pdf.save());
}
