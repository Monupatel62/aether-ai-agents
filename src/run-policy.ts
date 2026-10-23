export interface AgentRunPolicyV1 {
  readonly schemaVersion: "1";
  readonly maxSteps: number;
  readonly maxToolCalls: number;
  readonly maxWallTimeMs: number;
  readonly maxOutputTokens: number;
  readonly maxToolOutputBytes: number;
  readonly maxRetriesPerOperation: number;
  readonly allowedToolNames: readonly string[];
  readonly requireApprovalForSideEffects: true;
}

export type AgentPolicyIssueCode =
  | "unsupported_schema"
  | "invalid_budget"
  | "invalid_tool_name"
  | "duplicate_tool_name"
  | "side_effect_approval_required";

export interface AgentPolicyIssue {
  readonly code: AgentPolicyIssueCode;
  readonly path: string;
}

/** Static policy validation only; this does not execute agents or enforce budgets at runtime. */
export function validateAgentRunPolicy(policy: AgentRunPolicyV1): readonly AgentPolicyIssue[] {
  const issues: AgentPolicyIssue[] = [];
  if (policy.schemaVersion !== "1") issues.push({ code: "unsupported_schema", path: "/schemaVersion" });
  const bounds: readonly [keyof AgentRunPolicyV1, number, number][] = [
    ["maxSteps", 1, 1_000],
    ["maxToolCalls", 0, 2_000],
    ["maxWallTimeMs", 1_000, 60 * 60 * 1000],
    ["maxOutputTokens", 1, 1_000_000],
    ["maxToolOutputBytes", 1, 10 * 1024 * 1024],
    ["maxRetriesPerOperation", 0, 10]
  ];
  for (const [key, min, max] of bounds) {
    const value = policy[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
      issues.push({ code: "invalid_budget", path: `/${key}` });
    }
  }
  if (policy.requireApprovalForSideEffects !== true) {
    issues.push({ code: "side_effect_approval_required", path: "/requireApprovalForSideEffects" });
  }
  const seen = new Set<string>();
  policy.allowedToolNames.forEach((name, index) => {
    if (!/^[a-z][a-z0-9._-]{0,95}$/.test(name)) issues.push({ code: "invalid_tool_name", path: `/allowedToolNames/${index}` });
    if (seen.has(name)) issues.push({ code: "duplicate_tool_name", path: `/allowedToolNames/${index}` });
    seen.add(name);
  });
  if (policy.allowedToolNames.length > 500) issues.push({ code: "invalid_budget", path: "/allowedToolNames" });
  return issues;
}
