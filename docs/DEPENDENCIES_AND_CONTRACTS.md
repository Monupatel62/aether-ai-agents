# Dependencies and contracts — aether-ai-agents

**Status:** proposed contract; no API implementation exists yet.

## Contract area

Agent run contract, tool-call envelope, approval event, result and cancellation states.

## Direct dependencies

- `aether-ai-gateway`: bounded model request/response and streaming contract.
- `aether-ai-tools`: policy-enforced tool manifest and invocation contract.
- `aether-ai-memory`: scoped memory retrieval/write contract where enabled.
- `aether-ai-security`: policy request/decision and trusted-context contract.
- `aether-ai-observability`: redacted telemetry and lifecycle events.

## Explicit non-dependency: Orchestration

`aether-ai-agents` MUST NOT import or directly depend on `aether-ai-orchestration`. Orchestration owns durable run/step state, leases, retries, cancellation and recovery; it consumes the versioned Agent execution contract. Agents may emit versioned lifecycle/result events or return typed results, but must not call back into Orchestration's implementation. This direction avoids a package cycle and preserves one durable state-machine owner.

## Required rules

Specify run IDs, max steps/time/tokens, approved tools/scopes, lifecycle events, tool output size, human approval and cancellation semantics. Agent-local execution state must not become a competing durable run ledger.

## Contract governance

- The [master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md) and [dependency matrix](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/DEPENDENCY_MATRIX.md) are canonical dependency references.
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
