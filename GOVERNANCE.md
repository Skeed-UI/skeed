# Skeed Governance

## Maintainer tiers

| Tier | Scope | Responsibilities |
|---|---|---|
| **Core** | `packages/contracts/`, `packages/core/`, `packages/pipeline/`, repo-wide infra | Schema/contract changes; pipeline orchestration; release management; security |
| **Subsystem maintainer** | A specific package (e.g. `@skeed/scoring`, `@skeed/research-bridge`, `@skeed/asset-source-fal`) | PRs in their package; quality + tests; release cadence |
| **Domain lead** | One demographic under `data/demographics/<id>/` | Quality of preset, psychology, pain-points, logo primitives, illustration style |
| **Triager** | Issues + initial PR review | Label, deduplicate, assign, request changes |

## Decision-making

- **Trivial changes** (typo, single-component fix, doc): one maintainer approval.
- **New demographic, new archetype, new asset source, new LLM provider**: two approvals — at least one Core or Subsystem maintainer.
- **AAA-strict demographic content** (kids, education, health, gov, mental_wellness): two approvals **including the demographic's domain lead** plus an a11y reviewer.
- **Schema / contract changes** (`packages/contracts/`): two Core approvals + an RFC issue.
- **Demographic taxonomy changes** (closed enum in `packages/contracts/src/demographic.ts`): RFC + quarterly review window. Long-tail uses the open `tags[]` field.

## RFC process

1. Open an issue tagged `rfc:` with the proposal.
2. Two-week comment window. Discussion happens in the issue.
3. A Core maintainer summarizes consensus and either merges into a tracking issue or rejects with rationale.
4. Implementation PR references the RFC issue.

RFCs are required for: schema changes, demographic taxonomy changes, plugin-API breaks, license model changes, removing a package.

## Release cadence

- **Patch** (`0.x.y`): weekly while pre-1.0; rolling after.
- **Minor**: monthly cadence; gated on green CI + comparator (`scripts/comparator/`) regressions ≤ baseline.
- **Major**: announced at least one minor in advance; migration guide required.

## Code of conduct

We follow [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Report incidents to the email in `OWNERS.md`.
