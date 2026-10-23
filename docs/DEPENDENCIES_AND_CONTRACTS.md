# Dependencies and contracts — aether-ai-agents

**Status:** proposed contract; no API implementation exists yet.

## Contract area

Agent run contract, tool-call envelope, approval event, result and cancellation states

## Direct dependencies

Runtime-facing agent contracts consume `aether-ai-gateway`, `aether-ai-tools`, `aether-ai-memory`, `aether-ai-security`, and `aether-ai-observability`.

`aether-ai-orchestration` consumes the public, versioned agent contract; it is not a runtime dependency of the Agents component. Orchestration owns durable run/step state, worker recovery, and cross-process lifecycle transitions. Agents may define local domain transition helpers, but must not become a second durable ledger or call into Orchestration internals.

## Contract separation

- Agents submits model requests only through Gateway contracts.
- Agents requests tool actions through the public Tools contract; each invocation is independently authorized and policy-checked.
- Agent state/budget helpers describe bounded execution, but do not establish tenant membership, approval identity, persistent state, or a real-time deadline by themselves.
- Correlation/run events are proposals until their shared envelope and producer/consumer semantics are validated against the master contracts.


## Required rules

Specify run IDs, max steps/time/tokens, approved tools/scopes, lifecycle events, tool output size, human approval and cancellation semantics.

## Contract governance

- The [master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md) is the canonical dependency map.
- Public REST endpoints require OpenAPI definitions, versioning, stable error codes, and compatibility tests.
- Events require a schema version, event/run ID, timestamp, correlation ID, tenant/principal scope where appropriate, and explicit retry/idempotency semantics.
- Package interfaces must distinguish public stable exports from internal implementation details.
- No service may read another service's private tables or import downstream application internals.
- Any breaking change must include consumer inventory, migration notes, staged rollout/rollback plan, and an update to affected repository specs.
- Provider/model differences must be surfaced as capabilities; do not claim all models support the same features.
- Never expose provider credentials or raw sensitive upstream errors to browsers or ordinary logs.

## Review checklist

- [ ] Inputs, outputs, errors, payload limits, timeout and rate-limit behavior defined.
- [ ] Authentication, authorization, and tenant boundary defined.
- [ ] Retries, cancellation, duplicate requests, and side effects defined.
- [ ] Correlation IDs and redaction rules defined.
- [ ] Unit and contract tests planned.
- [ ] Direct and transitive dependency licenses checked before reuse.
