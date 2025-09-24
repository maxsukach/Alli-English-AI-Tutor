import type { PolicyResult, TaskFeedbackContract } from "./contracts";

const SENSITIVE_PATTERNS = [/\bpassword\b/i, /\bssn\b/i, /\bcredit\s*card\b/i];
const UNSAFE_PROMPT_TOKENS = [/\bharm\b/i, /\bviolence\b/i];

export class PolicyEngine {
  async validatePrompt(prompt: string): Promise<PolicyResult> {
    const violations = UNSAFE_PROMPT_TOKENS
      .filter((pattern) => pattern.test(prompt))
      .map((pattern) => ({
        code: "unsafe_prompt",
        message: `Prompt contains disallowed pattern: ${pattern}`,
      }));

    if (violations.length > 0) {
      return {
        valid: false,
        violations,
        redactedPrompt: prompt.replace(/harm/gi, "h—m"),
      };
    }

    return { valid: true, violations: [] };
  }

  async validateFeedback(feedback: TaskFeedbackContract["feedback"]): Promise<PolicyResult> {
    const plainText = [feedback.summary, ...feedback.errors.map((e) => e.correction)].join(" ");
    const sensitiveViolations = SENSITIVE_PATTERNS
      .filter((pattern) => pattern.test(plainText))
      .map((pattern) => ({
        code: "contains_sensitive_data",
        message: `Feedback contains a sensitive token ${pattern}`,
      }));

    if (sensitiveViolations.length > 0) {
      return {
        valid: false,
        violations: sensitiveViolations,
      };
    }

    return { valid: true, violations: [] };
  }
}
