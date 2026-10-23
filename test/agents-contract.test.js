import test from "node:test";
import assert from "node:assert/strict";
import { createAgentRun, transitionAgentRun, consumeAgentBudget, createAgentRunEvent, getAgentExecutionRequirements } from "../src/index.js";

const run = () => createAgentRun({ runId: "run-123", agentId: "agent-123", principalId: "user-123", tenantId: "tenant-123", correlationId: "corr-123", goal: "Summarize approved documents", approvalRequired: true });

test("creates bounded queued agent runs with server-validated scope", () => {
  const value = run();
  assert.equal(value.state, "queued");
  assert.equal(value.limits.maxSteps, 12);
  assert.throws(() => createAgentRun({ runId: "r", agentId: "a", principalId: "p", correlationId: "c", goal: "x" }), /tenantId/);
  assert.throws(() => createAgentRun({ runId: "r", agentId: "a", principalId: "p", tenantId: "t", correlationId: "c", goal: "x" }, { maxSteps: 101 }), /maxSteps/);
});

test("enforces lifecycle transitions and explicit approval", () => {
  let value = transitionAgentRun(run(), "planning");
  value = transitionAgentRun(value, "awaiting_approval");
  assert.throws(() => transitionAgentRun(value, "executing"), /explicit approval/);
  value = transitionAgentRun(value, "executing", { approvalGranted: true });
  value = transitionAgentRun(value, "completed");
  assert.throws(() => transitionAgentRun(value, "planning"), /terminal/);
});

test("enforces step and token budgets", () => {
  const value = run();
  assert.equal(consumeAgentBudget(value, { steps: 2, tokens: 200, elapsedMs: 100 }).stepsUsed, 2);
  assert.throws(() => consumeAgentBudget(value, { steps: 13 }), /step budget/);
  assert.throws(() => consumeAgentBudget(value, { tokens: 16001 }), /token budget/);
  assert.throws(() => consumeAgentBudget(value, { elapsedMs: 120001 }), /duration budget/);
});

test("creates redacted correlated run events", () => {
  const event = createAgentRunEvent({ eventId: "event-123", run: run(), eventType: "agent.step.completed", occurredAt: "2026-10-23T09:00:00Z", stepNumber: 1, data: { outcome: "success", prompt: "sensitive", accessToken: "secret", count: 1 } });
  assert.equal(event.correlationId, "corr-123");
  assert.deepEqual(event.data, { outcome: "success", count: 1 });
});

test("declares gateway, tool authorization, orchestration, and untrusted output boundaries", () => {
  const requirements = getAgentExecutionRequirements();
  assert.equal(requirements.modelCallsMustUseGatewayContract, true);
  assert.equal(requirements.durableRunStateOwnedByOrchestration, true);
  assert.equal(requirements.untrustedModelOutputMustNotGrantAuthority, true);
});
