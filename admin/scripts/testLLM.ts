/**
 * Smoke test for the active LLM provider (src/lib/llm).
 *
 * Usage (from admin/):
 *   npx ts-node -P tsconfig.scripts.json scripts/testLLM.ts
 *   npm run test:llm
 *
 * Loads .env then .env.local (local overrides). Requires the API key for the selected LLM_PROVIDER.
 */
import dotenv from 'dotenv';
import path from 'path';

const adminRoot = path.join(__dirname, '..');
/** Shell/CLI `LLM_PROVIDER=…` wins over values in .env.local */
const providerFromShell = process.env.LLM_PROVIDER;
dotenv.config({ path: path.join(adminRoot, '.env') });
dotenv.config({ path: path.join(adminRoot, '.env.local'), override: true });
if (providerFromShell) {
  process.env.LLM_PROVIDER = providerFromShell;
}

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'claude';
const providerName = LLM_PROVIDER === 'gemini' ? 'gemini' : 'claude';

const MOCK_SYSTEM_PROMPT =
  'You are a connectivity check. Reply with a single short HTML paragraph only. No markdown fences.';
const MOCK_GUIDELINE_TEXT = 'IBD guideline placeholder text for LLM smoke test.';
const MOCK_PROMPT =
  'Reply with exactly this HTML and nothing else: <p>LLM_OK</p>';

async function main(): Promise<void> {
  const { default: llmProvider } = await import('../src/lib/llm');

  console.log(`Running LLM smoke test (LLM_PROVIDER=${LLM_PROVIDER})…`);

  const textStream = await llmProvider.generateCarePlan(MOCK_PROMPT, {
    guidelineText: MOCK_GUIDELINE_TEXT,
    systemPrompt: MOCK_SYSTEM_PROMPT,
    patientIdForLog: 'test-llm-script',
    maxTokens: 1024,
  });

  let result = '';
  for await (const chunk of textStream) {
    result += chunk;
  }

  const preview = result.replace(/\s+/g, ' ').trim().slice(0, 200);

  console.log(`Provider: ${providerName}`);
  console.log(`Response length: ${result.length} characters`);
  console.log(`Response (first 200 chars): ${preview}${result.length > 200 ? '…' : ''}`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('FAIL:', message);
  process.exit(1);
});
