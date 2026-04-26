# Agent brief — `@skeed/research-bridge`

AutoResearchClaw client + lite-mode fallback. Sends a ResearchBrief, returns ResearchFindings.

## Scope

Single package. Do not edit elsewhere except this folder and (if your slice requires it) `packages/contracts/` for new shared types — but contracts changes need a separate PR first.

## What to build

Implement:

- src/client.ts — wraps AutoResearchClaw via MCP stdio (preferred) or CLI (`researchclaw run --topic ...`). Honor timeoutMs, budgetTokens.
- src/briefs/product-research.md — prompt template that reframes academic-research output as product research
- src/normalize.ts — parses AutoResearchClaw output (markdown + JSON) into ResearchFindings
- src/lite.ts — fallback research loop using only web search + LLM (when AutoResearchClaw unavailable)

Source repo: https://github.com/aiming-lab/AutoResearchClaw

Contract: ResearchEngine in @skeed/contracts/research-engine.

## Validation

```bash
pnpm --filter @skeed/research-bridge typecheck
pnpm --filter @skeed/research-bridge test
```
