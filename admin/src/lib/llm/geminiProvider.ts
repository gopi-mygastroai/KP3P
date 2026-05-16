import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CarePlanContext, CarePlanTextStream, LLMProvider } from './llmProvider';
import { LLMConfigurationError } from './llmProvider';

/** Default model (Google AI Studio). Override with GEMINI_MODEL if needed. */
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 32_000;
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

class GeminiProvider implements LLMProvider {
  async generateCarePlan(prompt: string, context?: CarePlanContext): Promise<CarePlanTextStream> {
    const ctx = requireContext(context);

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new LLMConfigurationError('GEMINI_API_KEY not configured');
    }

    const modelName = process.env.GEMINI_MODEL?.trim() || GEMINI_MODEL;

    try {
      const patientId = ctx.patientIdForLog ?? 'unknown';
      const guidelineFileSizeBytes = Buffer.byteLength(ctx.guidelineText, 'utf8');
      console.log(
        `[KP3P] Sending request to Gemini (${modelName}) — patient: ${patientId}, guideline text file size: ${guidelineFileSizeBytes} bytes`,
      );

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: ctx.systemPrompt,
        generationConfig: {
          maxOutputTokens: ctx.maxTokens ?? MAX_OUTPUT_TOKENS,
          temperature: ctx.temperature ?? TEMPERATURE,
        },
      });

      /** Guideline extracted text first, then patient `prompt` text (same ordering as Claude). */
      const userParts = [{ text: ctx.guidelineText }, { text: prompt }];
      const hasGuidelineTextBlock = Boolean(userParts[0]?.text);
      console.log(
        '[KP3P] Gemini request user message includes guideline text block:',
        hasGuidelineTextBlock,
      );

      const request = {
        contents: [{ role: 'user' as const, parts: userParts }],
      };
      const requestOptions = ctx.signal ? { signal: ctx.signal } : undefined;
      const result = await model.generateContentStream(request, requestOptions);

      async function* textStream(): AsyncGenerator<string> {
        for await (const chunk of result.stream) {
          yield chunk.text();
        }
      }

      return textStream();
    } catch (err: unknown) {
      if (err instanceof LLMConfigurationError) {
        throw err;
      }
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini provider error: ${detail}`, { cause: err });
    }
  }
}

const geminiProvider = new GeminiProvider();
export default geminiProvider;
