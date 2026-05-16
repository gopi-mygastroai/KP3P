import fs from 'fs';
import path from 'path';

export const IBD_RULEBOOK_PDF_FILENAME = 'IBD_Clinical_Rulebook_Final.pdf';
const IBD_RULEBOOK_TXT_FILENAME = 'IBD_Clinical_Rulebook_Final.txt';

export function ibdRulebookPdfPath(): string {
  return path.join(process.cwd(), 'medical-doc', IBD_RULEBOOK_PDF_FILENAME);
}

function ibdRulebookTxtPath(): string {
  return path.join(process.cwd(), 'medical-doc', IBD_RULEBOOK_TXT_FILENAME);
}

type PdfTextPage = { text?: string };
type PdfTextResult = { pages?: PdfTextPage[]; text?: string };

async function extractRulebookTextFromPdf(pdfPath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data });
  const result = (await parser.getText()) as PdfTextResult;

  if (typeof result.text === 'string' && result.text.trim()) {
    return result.text.trim();
  }

  const pages = result.pages ?? [];
  const text = pages
    .map((page) => page.text ?? '')
    .join('\n\n')
    .trim();

  if (!text) {
    throw new Error('Rulebook PDF produced empty text');
  }

  return text;
}

/**
 * Rulebook text for the LLM: prefers cached `.txt` (fast, no pdf-parse in the bundle).
 * Falls back to extracting `IBD_Clinical_Rulebook_Final.pdf` when the cache is missing.
 */
export async function loadIbdRulebookText(): Promise<string> {
  const txtPath = ibdRulebookTxtPath();
  if (fs.existsSync(txtPath)) {
    const cached = fs.readFileSync(txtPath, 'utf8').trim();
    if (cached) return cached;
  }

  const pdfPath = ibdRulebookPdfPath();
  if (!fs.existsSync(pdfPath)) {
    throw new Error(
      `Clinical rulebook not found. Add ${IBD_RULEBOOK_PDF_FILENAME} or ${IBD_RULEBOOK_TXT_FILENAME} under medical-doc/.`,
    );
  }

  const extracted = await extractRulebookTextFromPdf(pdfPath);

  try {
    fs.writeFileSync(txtPath, extracted, 'utf8');
  } catch (err) {
    console.warn('[load-ibd-rulebook] Could not write text cache:', err);
  }

  return extracted;
}
