import claudeProvider from './claudeProvider';
import geminiProvider from './geminiProvider';

export type { LLMProvider } from './llmProvider';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'claude';

if (LLM_PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required when LLM_PROVIDER=gemini');
}

if (LLM_PROVIDER === 'claude' && !process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required when LLM_PROVIDER=claude');
}

if (process.env.NODE_ENV !== 'production') {
  console.log(`[LLM] Active provider: ${LLM_PROVIDER === 'gemini' ? 'gemini' : 'claude'}`);
}

const provider = LLM_PROVIDER === 'gemini' ? geminiProvider : claudeProvider;

export default provider;
