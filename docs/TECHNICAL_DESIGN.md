# Technical design — aether-ai-agents

**Status:** design proposal; not implemented.

## Role

Agent runtime is bounded task execution, not an unrestricted loop or a second model gateway.

## Proposed internal structure

Proposed lifecycle: created -> queued -> running -> awaiting_approval (optional) -> succeeded/failed/cancelled/timed_out. Define max steps, wall time, token/cost budget, tool allowlist, max tool output, context budget, retry policy, and event schema. Delegate model calls to gateway and tool execution to tools registry.

## Connections and ownership

Use compatible WoHo DevKit @woho/agents/@woho/core where actual package exports fit; do not duplicate its runtime blindly. Agent calls tool registry only with scoped tool manifests. Orchestration owns durable state if run spans process restarts.

## Failure cases to design explicitly

- Invalid or unauthorized input.
- Dependency unavailable or responds with malformed/partial data.
- Timeout, cancellation, duplicate delivery/request, and retry exhaustion.
- Tenant or permission mismatch.
- Sensitive data accidentally entering logs or client-visible errors.

## Verification plan

Mock model/tool tests for plan/execute/recover; approval pause/resume; cancellation; max-step/time/cost bounds; tool permission denial; prompt injection; duplicate run IDs; and process crash/recovery integration.

## Open decisions

- Final language/framework and packaging model.
- Runtime deployment boundary (repository does not imply a separate service).
- Selected dependency versions and license review.
- Production observability/retention limits and release criteria.

## Change-comment policy

When implementation begins, explain security invariants, state transitions, retry/idempotency constraints, and non-obvious integration behavior in comments. Keep the comment standard at [the project-wide guide](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/ENGINEERING_AND_COMMENTING_STANDARD.md).

## Related docs

- [Project specification](PROJECT_SPEC.md)
- [Architecture](ARCHITECTURE.md)
- [Dependencies and contracts](DEPENDENCIES_AND_CONTRACTS.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)
- [Research and licenses](RESEARCH_AND_LICENSES.md)
- [Work log](WORKLOG.md)
- [Master repository spec](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/repositories/aether-ai-agents.md)

## DevKit integration boundary

The inspected `@woho/agents 0.3.28` source exposes bounded run options including cancellation, run/project/session IDs, approval hooks, checkpoint callbacks, tool lifecycle hooks, max steps/context/tool calls/token limits. It depends on `@woho/core`, `@woho/memory`, and `@woho/mcp`.

Treat this as a candidate runtime, not proof of production durability or tenant security. Aether's orchestration layer owns durable multi-process run state and recovery; Aether's dispatcher owns tenant/resource authorization and billing/audit policy. Confirm exact published package exports and run the test matrix in the [master DevKit compatibility review](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/DEVKIT_COMPATIBILITY_REVIEW.md) before adding dependencies.
