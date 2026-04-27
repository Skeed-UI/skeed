# AGENTS for special_occasion

Editing this folder requires:
1. Two reviewers when adding a new taste (tastes.json) or niche.
2. Manual run of `pnpm exec tsx packages/codegen/src/cli.ts --demo special_occasion` to regenerate components.
3. Snapshot of all 4 hero variants in `dist/snapshots/special_occasion/`.

DO NOT add tastes that conflict with `forbiddenPatterns` declared in any niche.
