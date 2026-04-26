# Agent brief — `@skeed/llm-provider-anthropic`

Implement the `LLMProvider` interface in `src/index.ts`. Contract lives at `packages/contracts/src/llm-provider.ts`.

## Required

1. `modelFor(tier)` maps `fast | balanced | strong` → concrete vendor model id.
2. `chat()` calls vendor SDK, parses JSON output against Zod schema, returns `LLMChatResult` with token counts.
3. `embed()` (optional) for semantic search.
4. **Prompt caching**: if vendor supports it (Anthropic does, OpenAI partially), set `supportsCache = true` and route `message.cacheable === true` blocks through native caching APIs.
5. Auth: read `process.env.SKEED_ANTHROPIC_API_KEY`.
6. Tests: mock SDK at module level, verify request shape, response parsing, schema validation, retry on schema fail.

## Do not

- Do not commit API keys.
- Do not import the vendor SDK at top level if it's heavy — lazy-import inside `chat()` to keep cold start fast.
