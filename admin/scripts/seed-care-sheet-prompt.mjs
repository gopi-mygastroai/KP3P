/**
 * Writes public/prompts/care-sheet-prompt.docx (required by /api/generate-care-sheet).
 * Run once after clone: npm run seed:care-sheet-prompt
 */
import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'prompts');
const outFile = path.join(outDir, 'care-sheet-prompt.docx');

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          children: [
            new TextRun(
              'You are a gastroenterology care-plan assistant. Given patient structured data below, write a concise patient-facing care sheet with: (1) Brief summary, (2) Lifestyle/medication reminders if data supports it, (3) When to seek urgent care. Use plain language. If data is sparse, say what is unknown and give general IBD self-care tips.'
            ),
          ],
        }),
      ],
    },
  ],
});

const buf = await Packer.toBuffer(doc);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, buf);
console.log('Wrote', outFile);
