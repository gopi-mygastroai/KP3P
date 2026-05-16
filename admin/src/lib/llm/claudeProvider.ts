import Anthropic from '@anthropic-ai/sdk';
import type { CarePlanContext, CarePlanTextStream, LLMProvider } from './llmProvider';
import { LLMConfigurationError } from './llmProvider';

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 32_000;
const TEMPERATURE = 0.1;

function requireContext(context: CarePlanContext | undefined): CarePlanContext {
  if (!context?.guidelineText?.trim()) {
    throw new Error('CarePlanContext.guidelineText is required');
  }
  if (!context.systemPrompt?.trim()) {
    throw new Error('CarePlanContext.systemPrompt is required');
  }
  return context;
}

class ClaudeProvider implements LLMProvider {
  async generateCarePlan(prompt: string, context?: CarePlanContext): Promise<CarePlanTextStream> {
    const ctx = requireContext(context);

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new LLMConfigurationError('ANTHROPIC_API_KEY not configured');
    }

    try {
      const anthropic = new Anthropic({ apiKey });

      const patientId = ctx.patientIdForLog ?? 'unknown';
      const guidelineFileSizeBytes = Buffer.byteLength(ctx.guidelineText, 'utf8');
      console.log(
        `[KP3P] Sending request to Claude (${CLAUDE_MODEL}) — patient: ${patientId}, guideline text file size: ${guidelineFileSizeBytes} bytes`,
      );

      /** Guideline extracted text first, then patient `prompt` text (same ordering as when PDF was sent first). */
      const userContent: Anthropic.Messages.ContentBlockParam[] = [
        { type: 'text', text: ctx.guidelineText },
        { type: 'text', text: prompt },
      ];

      const hasGuidelineTextBlock = userContent[0]?.type === 'text';
      console.log(
        '[KP3P] Claude request user message includes guideline text block:',
        hasGuidelineTextBlock,
      );

      const stream = anthropic.messages.stream(
        {
          model: CLAUDE_MODEL,
          max_tokens: ctx.maxTokens ?? MAX_TOKENS,
          temperature: ctx.temperature ?? TEMPERATURE,
          system: ctx.systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        },
        ctx.signal ? { signal: ctx.signal } : undefined,
      );

      async function* textStream(): AsyncGenerator<string> {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            yield chunk.delta.text;
          }
        }
      }

      return textStream();
    } catch (err: unknown) {
      if (err instanceof LLMConfigurationError) {
        throw err;
      }
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`Claude provider error: ${detail}`, { cause: err });
    }
  }
}

const claudeProvider = new ClaudeProvider();
export default claudeProvider;
