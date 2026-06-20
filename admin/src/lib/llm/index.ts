import claudeProvider from './claudeProvider';
import geminiProvider from './geminiProvider';
import type { CarePlanContext, CarePlanTextStream, LLMProvider } from './llmProvider';
import { LLMConfigurationError } from './llmProvider';

export type { CarePlanTextStream, LLMProvider } from './llmProvider';

function resolveProviderName(): 'claude' | 'gemini' {
  const raw = (process.env.LLM_PROVIDER ?? 'gemini').trim().toLowerCase();
  return raw === 'gemini' ? 'gemini' : 'claude';
}

function assertLlmEnvConfigured(): void {
  const name = resolveProviderName();
  if (name === 'gemini' && !process.env.GEMINI_API_KEY?.trim()) {
    throw new LLMConfigurationError(
      'GEMINI_API_KEY is not configured. Add it to admin/.env and restart the dev server.',
    );
  }
  if (name === 'claude' && !process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new LLMConfigurationError(
      'ANTHROPIC_API_KEY is not configured. Add it to admin/.env and restart the dev server.',
    );
  }
}

function pickProvider(): LLMProvider {
  return resolveProviderName() === 'gemini' ? geminiProvider : claudeProvider;
}

/** Validates env and logs provider on first use (safe during `next build`). */
const llmProvider: LLMProvider = {
  async generateCarePlan(prompt: string, context?: CarePlanContext): Promise<CarePlanTextStream> {
    assertLlmEnvConfigured();
    const name = resolveProviderName();
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[LLM] Active provider: ${name}`);
    }
    return pickProvider().generateCarePlan(prompt, context);
  },
};

export default llmProvider;
