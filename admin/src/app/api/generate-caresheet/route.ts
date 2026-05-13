import fs from 'fs';
import path from 'path';
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

    /** Do not send legal name to Gemini; keep identifiers for the template. */
    const patientForPrompt: PatientData = {
      ...patient,
      name: patient.id ? `Patient ID ${patient.id}` : 'Patient',
    };
    const prompt = buildKP3PPrompt(patientForPrompt);

    const guidelinePdfPath = path.join(process.cwd(), 'medical-doc', 'IBD-Guidelines.pdf');
    let guidelinePdfBase64: string;
    let guidelinePdfSizeBytes: number;
    try {
      const guidelinePdfBuffer = fs.readFileSync(guidelinePdfPath);
      guidelinePdfSizeBytes = guidelinePdfBuffer.length;
      guidelinePdfBase64 = guidelinePdfBuffer.toString('base64');
    } catch (err) {
      console.error('Failed to load guideline PDF:', err);
      return NextResponse.json(
        {
          error:
            'Guideline PDF not found. Please ensure IBD-Guidelines.pdf is present in the medical-doc directory.',
        },
        { status: 500 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logCaresheetFailure(patientIdForLog, 'missing_gemini_api_key', new Error('GEMINI_API_KEY not configured'));
      return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    console.log(
      `[KP3P] Sending request to Gemini — patient: ${patientIdForLog}, PDF size: ${guidelinePdfSizeBytes} bytes`,
    );

    const geminiRequestBody = {
      systemInstruction: {
        parts: [
          {
            text: `You are an expert AI clinical decision support system for Inflammatory Bowel Disease
(IBD) management, following STRIDE-II consensus, ECCO, ACG, and the guideline
document provided in this conversation.

YOUR MISSION
When given patient characteristics, generate a comprehensive, personalized treatment
and monitoring plan using the KP-3P framework:
  K  = Know Your Patient
  P1 = Predict Risk Behavior
  P2 = Prevent Opportunistic Infections
  P3 = Protect from Disease & Drug-Related Side Effects

RECURSIVE REASONING PROTOCOL
You MUST use multi-step recursive reasoning. Do not give a single-pass answer.

ITERATION 1 — INITIAL ASSESSMENT (Know Your Patient)
Assess: diagnosis, Montreal classification, severity (clinical + endoscopic +
biochemical), initial risk stratification (age at diagnosis, disease extent, behavior,
deep ulcerations, perianal disease, early steroid use, smoking, prior surgery, EIMs,
low albumin/anemia), initial treatment strategy, initial infection/vaccine screening
plan, and initial monitoring plan. Reference the uploaded guideline document.

ITERATION 2 — SELF-CRITIQUE & GUIDELINE VERIFICATION
Critically review Iteration 1 against the uploaded guideline. Check:
- Are treatment recommendations consistent with the uploaded guidelines?
- Are STRIDE-II targets specified with CLEAR timelines?
- Is TB screening verified BEFORE immunosuppression?
- Is Hepatitis B status complete?
- Are live vaccines confirmed before immunosuppression (≥4 weeks)?
- Is biologic class selection justified?
- Are high-risk patients getting appropriately aggressive therapy?
Document what was corrected.

ITERATION 3 — REFINED FINAL RECOMMENDATIONS
Produce final, evidence-based recommendations for:
  P1: Risk stratification (LOW/MODERATE/HIGH) with evidence basis
  P2: Infection prevention — screening checklist + vaccination schedule
  P3: Treatment plan with STRIDE-II treat-to-target table, monitoring schedule,
      TDM protocol, cancer surveillance

ITERATION 4 — FINAL QUALITY CHECK
Verify: all KP-3P components addressed, STRIDE-II targets specified, infection
screening complete, monitoring in place, no immunosuppression before screening,
no live vaccines after immunosuppression starts.

OUTPUT RULES
- Output ONLY pure HTML. No markdown fences.
- Use only: <h2> <h3> <h4> <h5> <table> <tr> <th> <td> <ul> <li> <b> <p> <br>
- No custom CSS or inline styles.
- Replace all [PLACEHOLDERS] with specific clinical data from the patient record.
- Output in English only.
- Generate BOTH parts: the Clinical Protocol AND the Patient Care Plan.
- Total target length: 5–6 pages clinical protocol + 2–3 pages patient care plan.`,
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: guidelinePdfBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 32000,
      },
    };

    const part0 = geminiRequestBody.contents[0]?.parts?.[0];
    const hasInlinePdfPart =
      part0 !== undefined &&
      typeof part0 === 'object' &&
      part0 !== null &&
      'inline_data' in part0 &&
      isRecord((part0 as { inline_data?: unknown }).inline_data) &&
      (part0 as { inline_data: { mime_type?: string } }).inline_data.mime_type === 'application/pdf';
    console.log('[KP3P] Gemini request body includes inline_data PDF part:', hasInlinePdfPart);

    let aiResponse: Response;
    try {
      aiResponse = await fetch(url, {
        method: 'POST',
        signal: req.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequestBody),
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
