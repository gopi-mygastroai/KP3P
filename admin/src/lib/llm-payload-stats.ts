/** Rough token estimate (~4 characters per token for English prose). */
export function estimateTokensFromText(text: string): number {
  if (!text.length) return 0;
  return Math.ceil(text.length / 4);
}

export interface CareSheetPayloadBreakdown {
  systemPromptChars: number;
  rulebookChars: number;
  patientPromptChars: number;
  totalChars: number;
  estimatedTotalTokens: number;
}

export function breakdownCareSheetPayload(
  systemPrompt: string,
  rulebookText: string,
  patientPrompt: string,
): CareSheetPayloadBreakdown {
  const systemPromptChars = systemPrompt.length;
  const rulebookChars = rulebookText.length;
  const patientPromptChars = patientPrompt.length;
  const totalChars = systemPromptChars + rulebookChars + patientPromptChars;

  return {
    systemPromptChars,
    rulebookChars,
    patientPromptChars,
    totalChars,
    estimatedTotalTokens: estimateTokensFromText(systemPrompt + rulebookText + patientPrompt),
  };
}
