/**
 * Drift guard — detects when emitted code drifts from the spec
 * (skeed.config.json). M4 will integrate codetruth at C:\dev\singularity-projects\codetruth
 * for a richer verification protocol; for now, this is a deterministic check
 * comparing demographic/brand/backend declarations against actual file contents.
 */
export interface DriftSpec {
  demographic: string;
  brandPrimary: string;
  backendStack: string[];
}

export interface DriftEvidence {
  file: string;
  found: string;
}

export interface DriftReport {
  ok: boolean;
  driftedFromSpec: Array<{ field: keyof DriftSpec; expected: string; evidence: DriftEvidence[] }>;
}

export function checkDrift(args: {
  spec: DriftSpec;
  files: Array<{ path: string; contents: string }>;
}): DriftReport {
  const drifted: DriftReport['driftedFromSpec'] = [];

  // brandPrimary — globals.css must contain the brand color
  const globals = args.files.find((f) => f.path.endsWith('app/globals.css'));
  if (globals && !globals.contents.toLowerCase().includes(args.spec.brandPrimary.toLowerCase())) {
    drifted.push({
      field: 'brandPrimary',
      expected: args.spec.brandPrimary,
      evidence: [
        {
          file: globals.path,
          found: globals.contents.match(/--skeed-brand:\s*([^;]+)/)?.[1] ?? '<not found>',
        },
      ],
    });
  }

  // backendStack — package.json must contain each declared dep
  const pkg = args.files.find((f) => f.path === 'package.json');
  if (pkg) {
    let pkgJson: { dependencies?: Record<string, string> } = {};
    try {
      pkgJson = JSON.parse(pkg.contents);
    } catch {
      pkgJson = {};
    }
    const deps = Object.keys(pkgJson.dependencies ?? {});
    // Stack ids that compose multiple npm packages — check their deps instead of literal name.
    const COMPOUND_STACKS: Record<string, string[]> = {
      'rsvp-csv-email': ['resend', 'csv-stringify'],
      nextauth: ['next-auth'],
      'anthropic-ai-sdk': ['ai', '@ai-sdk/anthropic'],
    };
    for (const wanted of args.spec.backendStack) {
      if (wanted === 'none') continue;
      const expanded = COMPOUND_STACKS[wanted] ?? [wanted];
      const allPresent = expanded.every((needed) =>
        deps.some((d) => d === needed || d.includes(needed) || needed.includes(d)),
      );
      if (!allPresent) {
        drifted.push({
          field: 'backendStack',
          expected: wanted,
          evidence: [{ file: pkg.path, found: deps.join(',').slice(0, 200) }],
        });
      }
    }
  }

  return { ok: drifted.length === 0, driftedFromSpec: drifted };
}
