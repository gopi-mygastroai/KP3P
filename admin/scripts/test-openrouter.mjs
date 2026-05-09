/**
 * Smoke test: OpenRouter chat completions (same endpoint as generate-care-sheet).
 * Usage: from repo root, `npm run test:openrouter`
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
if (!apiKey) {
  console.error('FAIL: OPENROUTER_API_KEY is missing in .env');
  process.exit(1);
}

const MODEL =
  process.env.OPENROUTER_MODEL?.trim() || 'liquid/lfm-2.5-1.2b-instruct:free';

const TEST_PROMPT =
  'You are a connectivity check. Reply with a single line containing exactly: OPENROUTER_OK';

const body = {
  model: MODEL,
  messages: [{ role: 'user', content: TEST_PROMPT }],
  max_tokens: 64,
};

const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3001',
    'X-Title': 'MyGastro AI OpenRouter Test',
  },
  body: JSON.stringify(body),
});

let data;
try {
  data = await res.json();
} catch (e) {
  console.error('FAIL: Response is not JSON', e);
  process.exit(1);
}

if (!res.ok) {
  console.error('FAIL: HTTP', res.status, JSON.stringify(data, null, 2));
  process.exit(1);
}

if (data.error) {
  console.error('FAIL: OpenRouter error', JSON.stringify(data.error, null, 2));
  process.exit(1);
}

const content = data.choices?.[0]?.message?.content;
if (!content || typeof content !== 'string') {
  console.error('FAIL: Missing choices[0].message.content', JSON.stringify(data, null, 2));
  process.exit(1);
}

const normalized = content.replace(/\s+/g, ' ').trim();
console.log('OK: OpenRouter chat/completions succeeded.');
console.log('  model (request):', MODEL);
console.log('  model (response):', data.model ?? '(not in body)');
console.log('  content:', normalized.slice(0, 160));

const hasMarker = normalized.includes('OPENROUTER_OK');
if (!hasMarker) {
  console.warn(
    'WARN: Expected substring OPENROUTER_OK in reply (model may paraphrase). Connection still valid.'
  );
  process.exit(0);
}

console.log('Validation: reply contains OPENROUTER_OK.');
process.exit(0);
