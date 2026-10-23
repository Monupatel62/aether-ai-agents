export const AGENT_CONTRACT_VERSION = "1.0";
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const RUN_STATES = new Set(["queued", "planning", "awaiting_approval", "executing", "completed", "failed", "cancelled", "timed_out"]);
const TERMINAL_STATES = new Set(["completed", "failed", "cancelled", "timed_out"]);

export function createAgentRun(input = {}, policy = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("run input must be an object");
  for (const field of ["runId", "agentId", "principalId", "correlationId"]) {
    if (typeof input[field] !== "string" || !ID_RE.test(input[field])) throw new TypeError(`${field} is invalid`);
  }
  if (typeof input.tenantId !== "string" || !ID_RE.test(input.tenantId)) throw new TypeError("server-validated tenantId is required");
  if (typeof input.goal !== "string" || !input.goal.trim() || input.goal.length > (policy.maxGoalChars ?? 8000)) throw new RangeError("goal must be non-empty and within configured character limit");
  const limits = {
    maxSteps: policy.maxSteps ?? 12,
    maxDurationMs: policy.maxDurationMs ?? 120_000,
    maxTokens: policy.maxTokens ?? 16_000,
  };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isInteger(value) || value < 1 || value > ({ maxSteps: 100, maxDurationMs: 3_600_000, maxTokens: 1_000_000 })[name]) throw new RangeError(`${name} is outside allowed bounds`);
  }
  if (input.initialState !== undefined && input.initialState !== "queued") throw new TypeError("new agent runs must start queued");
  return Object.freeze({
    contractVersion: AGENT_CONTRACT_VERSION,
    runId: input.runId,
    agentId: input.agentId,
    principalId: input.principalId,
    tenantId: input.tenantId,
    correlationId: input.correlationId,
    goal: input.goal.trim(),
    state: "queued",
    limits: Object.freeze(limits),
    stepsUsed: 0,
    tokensUsed: 0,
    elapsedMsUsed: 0,
    approvalRequired: input.approvalRequired === true,
  });
}

export function transitionAgentRun(run, nextState, { actor = "runtime", approvalGranted = false } = {}) {
  if (!run || run.contractVersion !== AGENT_CONTRACT_VERSION || !RUN_STATES.has(run.state)) throw new TypeError("valid agent run is required");
  if (!RUN_STATES.has(nextState)) throw new TypeError("unknown agent run state");
  if (TERMINAL_STATES.has(run.state)) throw new Error("terminal agent run cannot transition");
  const allowed = {
    queued: ["planning", "cancelled", "timed_out", "failed"],
    planning: ["awaiting_approval", "executing", "cancelled", "timed_out", "failed"],
    awaiting_approval: ["executing", "cancelled", "timed_out", "failed"],
    executing: ["awaiting_approval", "completed", "cancelled", "timed_out", "failed"],
  };
  if (!allowed[run.state].includes(nextState)) throw new Error(`invalid agent run transition: ${run.state} -> ${nextState}`);
  if (run.approvalRequired && run.state === "awaiting_approval" && nextState === "executing" && approvalGranted !== true) throw new Error("explicit approval is required to resume execution");
  if (actor !== "runtime" && actor !== "owner" && actor !== "system") throw new TypeError("invalid transition actor");
  return Object.freeze({ ...run, state: nextState });
}

export function consumeAgentBudget(run, { steps = 0, tokens = 0, elapsedMs = 0 } = {}) {
  if (!run || run.contractVersion !== AGENT_CONTRACT_VERSION) throw new TypeError("valid agent run is required");
  for (const [name, value] of Object.entries({ steps, tokens, elapsedMs })) if (!Number.isInteger(value) || value < 0) throw new TypeError(`${name} must be a non-negative integer`);
  const stepsUsed = run.stepsUsed + steps;
  const tokensUsed = run.tokensUsed + tokens;
  const elapsedMsUsed = (run.elapsedMsUsed ?? 0) + elapsedMs;
  if (stepsUsed > run.limits.maxSteps) throw new RangeError("agent step budget exceeded");
  if (tokensUsed > run.limits.maxTokens) throw new RangeError("agent token budget exceeded");
  if (elapsedMsUsed > run.limits.maxDurationMs) throw new RangeError("agent duration budget exceeded");
  return Object.freeze({ ...run, stepsUsed, tokensUsed, elapsedMsUsed });
}

export function createAgentRunEvent({ eventId, run, eventType, occurredAt, stepNumber, data = {} } = {}) {
  if (!run || run.contractVersion !== AGENT_CONTRACT_VERSION) throw new TypeError("valid agent run is required");
  for (const [field, value] of Object.entries({ eventId, eventType, occurredAt })) if (typeof value !== "string" || !ID_RE.test(value) && field !== "occurredAt") throw new TypeError(`${field} is invalid`);
  if (Number.isNaN(Date.parse(occurredAt))) throw new TypeError("occurredAt must be a valid timestamp");
  if (stepNumber !== undefined && (!Number.isInteger(stepNumber) || stepNumber < 0 || stepNumber > run.limits.maxSteps)) throw new RangeError("stepNumber is outside run bounds");
  const safeData = Object.fromEntries(Object.entries(data && typeof data === "object" && !Array.isArray(data) ? data : {})
    .filter(([key, value]) => /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key) && !/(token|secret|password|prompt|content|credential|authorization|cookie)/i.test(key) && ["string", "number", "boolean"].includes(typeof value)).slice(0, 20));
  return Object.freeze({
    contractVersion: AGENT_CONTRACT_VERSION,
    eventId,
    eventType,
    runId: run.runId,
    tenantId: run.tenantId,
    principalId: run.principalId,
    correlationId: run.correlationId,
    occurredAt,
    ...(stepNumber !== undefined ? { stepNumber } : {}),
    data: Object.freeze(safeData),
  });
}

export function getAgentExecutionRequirements() {
  return Object.freeze({
    modelCallsMustUseGatewayContract: true,
    toolCallsRequireIndependentAuthorization: true,
    durableRunStateOwnedByOrchestration: true,
    cancellationMustBePropagated: true,
    untrustedModelOutputMustNotGrantAuthority: true,
  });
}
