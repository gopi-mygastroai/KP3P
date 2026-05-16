/**
 * Shared contract for KP-3P care plan generation across LLM backends.
 * Mirrors the Anthropic Messages API shape: system prompt + user blocks
 * (guideline text, then patient/template prompt).
 */
export interface CarePlanContext {
  /** Full IBD guideline document text (first user content block). */
  guidelineText: string;
  /** System / instruction prompt (KP-3P protocol rules). */
  systemPrompt: string;
  /** Optional abort signal (e.g. client cancelled the HTTP request). */
  signal?: AbortSignal;
  /** Override default model id for this provider. */
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Optional id for provider-side logging. */
  patientIdForLog?: string;
}

export interface LLMProvider {
  generateCarePlan(prompt: string, context?: CarePlanContext): Promise<string>;
}

export class LLMConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMConfigurationError';
  }
}
