# aether-ai-agents

> **Status: Initial bounded agent-run policy validator is in review.** No agent runtime, durable state, model planning, or production deployment is implemented.

## Purpose

Agent runtime, lifecycle, tool selection, approvals, bounded execution, and execution results.

## Responsibility boundary

Runs agent tasks using explicit policies; does not bypass API authorization.

## Dependencies

aether-ai-gateway, aether-ai-tools, aether-ai-memory, aether-ai-security, and aether-ai-observability.

## Project rules

- No implementation starts until the documentation and cross-repository contracts are reviewed.
- Do not commit secrets, API keys, user data, or production credentials.
- Public interfaces, security decisions, and non-obvious implementation choices must be documented.

## Initial implementation

The draft package validates max-step, tool-call, wall-time, output-token, tool-output, and retry budgets; checks the tool allowlist; and requires a fail-closed policy flag for approval of side effects. It does not execute agents, enforce budgets at runtime, authenticate the caller, persist runs, or integrate with gateway/tools. Budget defaults and lifecycle contracts remain provisional.

## Documentation

- [Project specification](docs/PROJECT_SPEC.md)
- [Architecture and connections](docs/ARCHITECTURE.md)
- [Dependencies and contracts](docs/DEPENDENCIES_AND_CONTRACTS.md)
- [Implementation plan and acceptance criteria](docs/IMPLEMENTATION_PLAN.md)
- [Research and license notes](docs/RESEARCH_AND_LICENSES.md)
- [Repository-specific technical design and test plan](docs/TECHNICAL_DESIGN.md)
- [Repository-specific security review checklist](docs/SECURITY_REVIEW.md)
- [Engineering and commenting standard](docs/ENGINEERING_STANDARD.md)
- [Work log and decisions](docs/WORKLOG.md)
- [Master 33-repository catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
- [Continuity handoff for new chats](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/WORK_HANDOFF.md)

## Before coding

Read the project specification, architecture, contracts, implementation plan, and work log. Update the docs in the same change whenever behavior, an API contract, a dependency, or a security boundary changes.
