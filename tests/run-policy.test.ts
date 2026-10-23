import { describe, expect, it } from "vitest";
import { validateAgentRunPolicy } from "../src/index.js";
import type { AgentRunPolicyV1 } from "../src/index.js";

const policy: AgentRunPolicyV1 = {
  schemaVersion: "1",
  maxSteps: 20,
  maxToolCalls: 10,
  maxWallTimeMs: 60_000,
  maxOutputTokens: 8_000,
  maxToolOutputBytes: 256 * 1024,
  maxRetriesPerOperation: 2,
  allowedToolNames: ["calendar.read", "search.query"],
  requireApprovalForSideEffects: true
};

describe("bounded agent run policy", () => {
  it("accepts bounded budgets and an explicit tool allowlist", () => {
    expect(validateAgentRunPolicy(policy)).toEqual([]);
  });

  it("rejects unbounded budgets, invalid names, and duplicate tools", () => {
    const invalid = {
      ...policy,
      maxSteps: 100_000,
      maxWallTimeMs: 0,
      allowedToolNames: ["calendar.read", "calendar.read", "Bad Name"]
    } as AgentRunPolicyV1;
    const codes = validateAgentRunPolicy(invalid).map(issue => issue.code);
    expect(codes).toContain("invalid_budget");
    expect(codes).toContain("duplicate_tool_name");
    expect(codes).toContain("invalid_tool_name");
  });

  it("requires side-effect approval policy to remain fail-closed", () => {
    const invalid = { ...policy, requireApprovalForSideEffects: false } as unknown as AgentRunPolicyV1;
    expect(validateAgentRunPolicy(invalid).map(issue => issue.code)).toContain("side_effect_approval_required");
  });
});
