import { NextRequest, NextResponse } from 'next/server';
import { CARE_SHEET_SYSTEM_PROMPT } from '@/lib/care-sheet-system-prompt';
import { loadIbdRulebookText } from '@/lib/load-ibd-rulebook';
import { breakdownCareSheetPayload } from '@/lib/llm-payload-stats';
import { buildKP3PPrompt, type PatientData } from '@/lib/kp3p-prompt';
import llmProvider from '@/lib/llm';
import { LLMConfigurationError } from '@/lib/llm/llmProvider';

export const maxDuration = 300;

const USER_FRIENDLY_502 =
  'Care sheet generation failed. Please try again or contact support.';
const KP3P_STREAM_END_MARKER = '<div data-kp3p-end="true"></div>';
const MAX_STREAM_OUTPUT_CHARS = 120_000;

function toLlmConfigurationMessage(err: LLMConfigurationError): string {
  if (err.message.includes('GEMINI_API_KEY')) {
    return 'LLM is not configured: set GEMINI_API_KEY in admin/.env, then restart the server.';
  }
  if (err.message.includes('ANTHROPIC_API_KEY')) {
    return 'LLM is not configured: set ANTHROPIC_API_KEY in admin/.env, then restart the server.';
  }
  return 'LLM is not configured correctly. Please update admin/.env and restart the server.';
}

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

export async function POST(req: NextRequest): Promise<Response> {
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

    /** Redact patient legal name before sending to LLM; physician contact is never in the prompt. */
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
            'Clinical rulebook not found. Please ensure IBD_Clinical_Rulebook_Final2.pdf is present in the medical-doc directory.',
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

    let textStream: AsyncIterable<string>;
    try {
      textStream = await llmProvider.generateCarePlan(prompt, {
        guidelineText: rulebookText,
        systemPrompt: CARE_SHEET_SYSTEM_PROMPT,
        signal: req.signal,
        patientIdForLog,
      });
    } catch (callErr: unknown) {
      if (callErr instanceof LLMConfigurationError) {
        logCaresheetFailure(
          patientIdForLog,
          'llm_provider_not_configured',
          callErr,
        );
        return NextResponse.json(
          { error: toLlmConfigurationMessage(callErr) },
          { status: 500 },
        );
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

    const encoder = new TextEncoder();
    let outputChars = 0;

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        let pending = '';
        let endedByMarker = false;
        try {
          for await (const chunk of textStream) {
            if (!chunk) continue;
            pending += chunk;

            const markerIdx = pending.indexOf(KP3P_STREAM_END_MARKER);
            if (markerIdx !== -1) {
              const beforeMarker = pending.slice(0, markerIdx);
              if (beforeMarker) {
                outputChars += beforeMarker.length;
                controller.enqueue(encoder.encode(beforeMarker));
              }
              endedByMarker = true;
              break;
            }

            const flushLen = Math.max(0, pending.length - (KP3P_STREAM_END_MARKER.length - 1));
            if (flushLen > 0) {
              const flushChunk = pending.slice(0, flushLen);
              pending = pending.slice(flushLen);
              outputChars += flushChunk.length;
              controller.enqueue(encoder.encode(flushChunk));
            }

            if (outputChars >= MAX_STREAM_OUTPUT_CHARS) {
              logCaresheetFailure(patientIdForLog, 'llm_stream_output_char_limit', {
                maxChars: MAX_STREAM_OUTPUT_CHARS,
                outputChars,
              });
              break;
            }
          }

          if (!endedByMarker && pending) {
            outputChars += pending.length;
            controller.enqueue(encoder.encode(pending));
            pending = '';
          }

          console.log('[KP3P] LLM output payload', {
            patientId: patientIdForLog,
            outputChars,
            estimatedOutputTokens: Math.ceil(outputChars / 4),
            endedByMarker,
          });
          controller.close();
        } catch (err) {
          logCaresheetFailure(patientIdForLog, 'llm_stream_pipe_failed', err);
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: unknown) {
    logCaresheetFailure(patientIdForLog, 'generate_caresheet_unhandled', err);
    return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
  }
}
