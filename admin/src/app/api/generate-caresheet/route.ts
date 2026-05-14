import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildKP3PPrompt, type PatientData } from '@/lib/kp3p-prompt';

export const maxDuration = 60;

const USER_FRIENDLY_502 =
  'Care sheet generation failed. Please try again or contact support.';
const MODEL_FORMAT_502 = 'The model returned an unexpected response format.';

/** Same system text previously sent as Gemini `systemInstruction.parts[0].text`. */
const SYSTEM_PROMPT = `You are an expert AI clinical decision support system for Inflammatory Bowel Disease
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
- Total target length: 5–6 pages clinical protocol + 2–3 pages patient care plan.`;

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

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
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

function extractFirstTextFromClaudeContent(
  content: Anthropic.Messages.ContentBlock[],
): string {
  const first = content[0];
  if (first && first.type === 'text' && 'text' in first && typeof first.text === 'string') {
    return first.text;
  }
  for (const block of content) {
    if (block.type === 'text' && 'text' in block && typeof block.text === 'string') {
      return block.text;
    }
  }
  return '';
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

    // process.env.GEMINI_API_KEY;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logCaresheetFailure(
        patientIdForLog,
        'missing_anthropic_api_key',
        new Error('ANTHROPIC_API_KEY not configured'),
      );
      return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
    }

    const anthropic = new Anthropic({ apiKey });

    console.log(
      `[KP3P] Sending request to Claude — patient: ${patientIdForLog}, PDF size: ${guidelinePdfSizeBytes} bytes`,
    );

    /** Same ordering as Gemini: PDF inline_data first, then patient `prompt` text. */
    const userContent: Anthropic.Messages.ContentBlockParam[] = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: guidelinePdfBase64,
        },
      },
      { type: 'text', text: prompt },
    ];

    const hasPdfDocument =
      userContent[0]?.type === 'document' &&
      userContent[0].source.type === 'base64' &&
      userContent[0].source.media_type === 'application/pdf';
    console.log('[KP3P] Claude request user message includes PDF document part:', hasPdfDocument);

    let response: Anthropic.Messages.Message;
    try {
      response = await anthropic.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: 32000,
          temperature: 0.1,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }],
        },
        { signal: req.signal },
      );
    } catch (callErr: unknown) {
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
      logCaresheetFailure(patientIdForLog, 'claude_messages_create_threw', callErr);
      return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
    }

    const modelOutput = extractFirstTextFromClaudeContent(response.content);
    if (!modelOutput.trim() || modelOutput.length < 100) {
      logCaresheetFailure(patientIdForLog, 'claude_empty_or_short_content', new Error('content_too_short'), {
        contentLength: modelOutput.length,
      });
      return NextResponse.json({ error: MODEL_FORMAT_502 }, { status: 502 });
    }

    return NextResponse.json({ htmlContent: modelOutput }, { status: 200 });
  } catch (err: unknown) {
    logCaresheetFailure(patientIdForLog, 'generate_caresheet_unhandled', err);
    return NextResponse.json({ error: USER_FRIENDLY_502 }, { status: 502 });
  }
}
