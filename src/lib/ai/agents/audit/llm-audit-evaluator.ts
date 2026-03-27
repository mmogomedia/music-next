/**
 * LLM Audit Evaluator
 *
 * Shared utility for all 4 dimension audit agents.
 * Sends a single model.invoke() call to Azure OpenAI and maps the
 * JSON response back to AuditCheck[].
 *
 * Falls back to the rule-based result if the LLM call fails or returns
 * malformed output — the SSE stream continues without interruption.
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createModel } from '@/lib/ai/agents/model-factory';
import { extractTextContent } from '@/lib/ai/tool-executor';
import type { AuditCheck } from '@/types/career-intelligence';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LLMCheckInput {
  checkId: string;
  label: string;
  impact: number;
  /** The deterministic rule result — passed to the LLM as a hint, not a constraint */
  rulePassedHint: boolean;
  /** The actual data values so the LLM can reason qualitatively (e.g. "Bio: 'I make beats' (12 chars)") */
  ruleDetail: string;
}

interface LLMCheckOutput {
  checkId: string;
  passed: boolean;
  details: string;
}

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Evaluate a set of audit checks using Azure OpenAI.
 *
 * @param systemPrompt  - Dimension-specific system context (who the LLM is)
 * @param artistContext - Formatted artist data snapshot for this dimension
 * @param checks        - Static check definitions with rule hints and raw data
 * @param fallbackFn    - Called if the LLM fails; must return valid AuditCheck[]
 */
export async function evaluateChecksWithLLM(
  systemPrompt: string,
  artistContext: string,
  checks: LLMCheckInput[],
  fallbackFn: () => AuditCheck[]
): Promise<AuditCheck[]> {
  try {
    const model = createModel('azure-openai');

    const checksJson = JSON.stringify(
      checks.map(c => ({
        checkId: c.checkId,
        label: c.label,
        rulePassedHint: c.rulePassedHint,
        ruleDetail: c.ruleDetail,
      }))
    );

    const userContent = `${artistContext}

Evaluate the following checks:
${checksJson}

Return ONLY a valid JSON array — no markdown, no explanation:
[{"checkId": string, "passed": boolean, "details": string}]`;

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userContent),
    ]);

    const raw = extractTextContent(response.content);
    const parsed = parseAndValidate(raw, checks);

    // Merge LLM {passed, details} onto the static {checkId, label, impact}
    return checks.map(c => {
      const llmResult = parsed.find(r => r.checkId === c.checkId);
      return {
        checkId: c.checkId,
        label: c.label,
        impact: c.impact,
        passed: llmResult?.passed ?? c.rulePassedHint,
        details: llmResult?.details ?? c.ruleDetail,
      };
    });
  } catch (err) {
    console.error(
      '[LLMAuditEvaluator] LLM evaluation failed, using rule fallback:',
      err
    );
    return fallbackFn();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function parseAndValidate(
  raw: string,
  expectedChecks: LLMCheckInput[]
): LLMCheckOutput[] {
  const cleaned = stripCodeFences(raw);
  const parsed = JSON.parse(cleaned) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('LLM response is not an array');
  }

  if (parsed.length !== expectedChecks.length) {
    throw new Error(
      `LLM returned ${parsed.length} checks, expected ${expectedChecks.length}`
    );
  }

  const expectedIds = new Set(expectedChecks.map(c => c.checkId));

  for (const item of parsed) {
    if (!item || typeof item !== 'object') {
      throw new Error('LLM response item is not an object');
    }
    const { checkId, passed, details } = item as Record<string, unknown>;
    if (typeof checkId !== 'string' || !expectedIds.has(checkId)) {
      throw new Error(`Unexpected or missing checkId: ${String(checkId)}`);
    }
    if (typeof passed !== 'boolean') {
      throw new Error(
        `"passed" is not boolean for checkId: ${String(checkId)}`
      );
    }
    if (typeof details !== 'string' || details.trim().length === 0) {
      throw new Error(`"details" is empty for checkId: ${String(checkId)}`);
    }
  }

  return parsed as LLMCheckOutput[];
}
