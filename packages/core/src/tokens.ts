/**
 * Semantic token namespace.
 *
 * Archetype TSX consumes these strings; the transformer resolves them
 * to concrete CSS values per active DemographicPreset. Literal hex/px/rem
 * in archetype source is forbidden by `eslint-plugin-skeed/no-literal-tokens`.
 */

export const TOKEN_NAMESPACES = [
  'color',
  'spacing',
  'radius',
  'font',
  'shadow',
  'motion',
  'border',
  'density',
  'icon',
] as const;
export type TokenNamespace = (typeof TOKEN_NAMESPACES)[number];

export interface TokenRef {
  namespace: TokenNamespace;
  path: string[];
  raw: string;
}

const TOKEN_PATTERN = /^([a-z]+)\.([a-z0-9.-]+)$/;

export function parseTokenRef(ref: string): TokenRef | null {
  const match = TOKEN_PATTERN.exec(ref);
  if (!match) return null;
  const [, namespace, rest] = match;
  if (!namespace || !rest) return null;
  if (!TOKEN_NAMESPACES.includes(namespace as TokenNamespace)) return null;
  return {
    namespace: namespace as TokenNamespace,
    path: rest.split('.'),
    raw: ref,
  };
}

export function isTokenRef(value: string): boolean {
  return parseTokenRef(value) !== null;
}

/** Convert a token reference to its CSS custom property name. */
export function tokenToCssVar(ref: TokenRef): string {
  return `--skeed-${ref.namespace}-${ref.path.join('-')}`;
}

/** Convert a raw token string to a CSS `var()` expression. */
export function tokenToVarExpr(raw: string): string {
  const parsed = parseTokenRef(raw);
  if (!parsed) throw new Error(`invalid token reference: ${raw}`);
  return `var(${tokenToCssVar(parsed)})`;
}
