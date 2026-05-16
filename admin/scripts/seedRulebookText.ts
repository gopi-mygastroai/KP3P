/**
 * Extract medical-doc/IBD_Clinical_Rulebook_Final.pdf → IBD_Clinical_Rulebook_Final.txt
 * Usage: npm run seed:rulebook-text
 */
import { loadIbdRulebookText, ibdRulebookPdfPath } from '../src/lib/load-ibd-rulebook';

async function main(): Promise<void> {
  const text = await loadIbdRulebookText();
  console.log(`OK: rulebook text ready (${text.length.toLocaleString()} chars)`);
  console.log(`PDF: ${ibdRulebookPdfPath()}`);
}

main().catch((err: unknown) => {
  console.error('FAIL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
