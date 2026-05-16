import { NextRequest, NextResponse } from 'next/server';
import { CARE_SHEET_SYSTEM_PROMPT } from '@/lib/care-sheet-system-prompt';
import { loadIbdRulebookText } from '@/lib/load-ibd-rulebook';
import { breakdownCareSheetPayload, estimateTokensFromText } from '@/lib/llm-payload-stats';
import { buildKP3PPrompt, type PatientData } from '@/lib/kp3p-prompt';
import llmProvider from '@/lib/llm';
import { LLMConfigurationError } from '@/lib/llm/llmProvider';

export const maxDuration = 300;

const USER_FRIENDLY_502 =
  'Care sheet generation failed. Please try again or contact support.';
const MODEL_FORMAT_502 = 'The model returned an unexpected response format.';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isoTimestamp(): string {
  return new Date().toISOString();
}

function logCaresheetFailure(
  patientId: string,
  context: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  const base = { timestamp: isoTimestamp(), patientId, context, ...extra };
  if (err instanceof Error) {
    console.error('[generate-caresheet]', base, err.message, err.stack);
  } else {
    console.error('[generate-caresheet]', base, err);
  }
}

function isLikelyAbortError(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') return true;
  if (err && typeof err === 'object' && 'constructor' in err) {
    const c = (err as { constructor?: { name?: string } }).constructor;
    return c?.name === 'APIUserAbortError';
  }
  return false;
}

function httpStatusFromUnknown(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'cause' in err) {
    const fromCause = httpStatusFromUnknown((err as { cause: unknown }).cause);
    if (fromCause !== undefined) return fromCause;
  }
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let patientIdForLog = 'unknown';

  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch (parseBodyErr) {
      logCaresheetFailure(patientIdForLog, 'request_json_parse_failed', parseBodyErr);
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    if (!isRecord(raw)) {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const patient = raw as unknown as PatientData;
    patientIdForLog = String(patient.id ?? 'unknown');

    /** Do not send legal name to the model; keep identifiers for the template. */
    const patientForPrompt: PatientData = {
      ...patient,
      name: patient.id ? `Patient ID ${patient.id}` : 'Patient',
    };
    const prompt = buildKP3PPrompt(patientForPrompt);

    let rulebookText: string;
    try {
      rulebookText = await loadIbdRulebookText();
    } catch (err) {
      console.error('Failed to load IBD clinical rulebook PDF:', err);
      return NextResponse.json(
        {
          error:
            'Clinical rulebook not found. Please ensure IBD_Clinical_Rulebook_Final.pdf is present in the medical-doc directory.',
        },
        { status: 500 },
      );
    }

    const payloadStats = breakdownCareSheetPayload(
      CARE_SHEET_SYSTEM_PROMPT,
      rulebookText,
      prompt,
    );
    console.log('[KP3P] LLM input payload', {
      patientId: patientIdForLog,
      systemPromptChars: payloadStats.systemPromptChars,
      rulebookChars: payloadStats.rulebookChars,
      patientPromptChars: payloadStats.patientPromptChars,
      totalChars: payloadStats.totalChars,
      estimatedInputTokens: payloadStats.estimatedTotalTokens,
    });

    let result: string;
    try {
      result = await llmProvider.generateCarePlan(prompt, {
        guidelineText: rulebookText,
        systemPrompt: CARE_SHEET_SYSTEM_PROMPT,
        signal: req.signal,
        patientIdForLog,
      });
    } catch (callErr: unknown) {
      if (callErr instanceof LLMConfigurationError) {
        logCaresheetFailure(
          patientIdForLog,
          'missing_anthropic_api_key',
          callErr,
        );
        return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
      }
      if (isLikelyAbortError(callErr)) {
        logCaresheetFailure(patientIdForLog, 'claude_request_aborted', callErr);
        return new NextResponse(null, { status: 499 });
      }
      const errStatus = httpStatusFromUnknown(callErr);
      if (errStatus === 429) {
        logCaresheetFailure(patientIdForLog, 'claude_rate_limit', callErr, { status: errStatus });
        return NextResponse.json(
          {
            error:
              'Anthropic rate limit or quota exceeded. Wait and retry, or check your plan and usage at https://docs.anthropic.com/',
          },
          { status: 429 },
        );
      }
      logCaresheetFailure(patientIdForLog, 'claude_messages_stream_threw', callErr);
      return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
    }

    if (!result.trim() || result.length < 100) {
      logCaresheetFailure(patientIdForLog, 'claude_empty_or_short_content', new Error('content_too_short'), {
        contentLength: result.length,
      });
      return NextResponse.json({ error: MODEL_FORMAT_502 }, { status: 502 });
    }

    console.log('[KP3P] LLM output payload', {
      patientId: patientIdForLog,
      outputChars: result.length,
      estimatedOutputTokens: estimateTokensFromText(result),
    });

    return NextResponse.json({ htmlContent: result }, { status: 200 });
  } catch (err: unknown) {
    logCaresheetFailure(patientIdForLog, 'generate_caresheet_unhandled', err);
    return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
  }
}
