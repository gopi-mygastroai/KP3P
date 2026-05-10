import { NextRequest, NextResponse } from 'next/server';
import { buildKP3PPrompt, type PatientData } from '@/lib/kp3p-prompt';

export const maxDuration = 60;

const USER_FRIENDLY_502 =
  'Care sheet generation failed. Please try again or contact support.';
const GEMINI_FORMAT_502 = 'Gemini returned an unexpected response format.';

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

/** Validates Gemini generateContent JSON shape before reading nested fields. */
function geminiResponseHasExpectedShape(data: unknown): boolean {
  if (!isRecord(data)) return false;
  const candidates = data.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return false;
  const c0 = candidates[0];
  if (!isRecord(c0)) return false;
  const content = c0.content;
  if (!isRecord(content)) return false;
  const parts = content.parts;
  if (!Array.isArray(parts) || parts.length === 0) return false;
  const p0 = parts[0];
  if (!isRecord(p0)) return false;
  return typeof p0.text === 'string';
}

function extractGeminiText(data: unknown): string {
  if (!geminiResponseHasExpectedShape(data)) return '';
  if (!isRecord(data)) return '';
  const candidates = data.candidates as unknown[];
  const c0 = candidates[0] as Record<string, unknown>;
  const content = c0.content as Record<string, unknown>;
  const parts = content.parts as unknown[];
  const p0 = parts[0] as Record<string, unknown>;
  const text = p0.text;
  return typeof text === 'string' ? text : '';
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

    const prompt = buildKP3PPrompt(patient);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logCaresheetFailure(patientIdForLog, 'missing_gemini_api_key', new Error('GEMINI_API_KEY not configured'));
      return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let aiResponse: Response;
    try {
      aiResponse = await fetch(url, {
        method: 'POST',
        signal: req.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: 'You are a medical documentation assistant. Fill templates exactly as instructed. Output ONLY the filled template — no preamble, no markdown fences.',
              },
            ],
          },
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 16000,
          },
        }),
      });
    } catch (fetchErr) {
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        logCaresheetFailure(patientIdForLog, 'gemini_fetch_aborted', fetchErr);
        return new NextResponse(null, { status: 499 });
      }
      logCaresheetFailure(patientIdForLog, 'gemini_fetch_threw', fetchErr);
      return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
    }

    if (!aiResponse.ok) {
      let bodyText = '';
      try {
        bodyText = await aiResponse.text();
      } catch (textErr) {
        logCaresheetFailure(patientIdForLog, 'gemini_error_body_read_failed', textErr, {
          status: aiResponse.status,
        });
      }
      logCaresheetFailure(patientIdForLog, 'gemini_http_non_ok', new Error(`HTTP ${aiResponse.status}`), {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        body: bodyText,
      });
      return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
    }

    let aiData: unknown;
    try {
      aiData = await aiResponse.json();
    } catch (jsonErr) {
      logCaresheetFailure(patientIdForLog, 'gemini_response_json_parse_failed', jsonErr);
      return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
    }

    if (!geminiResponseHasExpectedShape(aiData)) {
      logCaresheetFailure(patientIdForLog, 'gemini_unexpected_response_shape', new Error('shape_validation_failed'), {
        responsePreview:
          typeof aiData === 'object' ? JSON.stringify(aiData).slice(0, 4000) : String(aiData),
      });
      return NextResponse.json({ error: GEMINI_FORMAT_502 }, { status: 502 });
    }

    const modelOutput = extractGeminiText(aiData);
    if (!modelOutput.trim() || modelOutput.length < 100) {
      logCaresheetFailure(patientIdForLog, 'gemini_empty_or_short_content', new Error('content_too_short'), {
        contentLength: modelOutput.length,
      });
      return NextResponse.json({ error: GEMINI_FORMAT_502 }, { status: 502 });
    }

    return NextResponse.json({ htmlContent: modelOutput }, { status: 200 });
  } catch (err: unknown) {
    logCaresheetFailure(patientIdForLog, 'generate_caresheet_unhandled', err);
    return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
  }
}
