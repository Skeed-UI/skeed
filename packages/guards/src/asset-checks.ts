/**
 * Asset-checks guard. Validates generated/sourced assets:
 *   - Alt text present and meaningful
 *   - SVG has <title>
 *   - AI-rendered images don't contain garbled text (heuristic OCR — left as
 *     pluggable hook because tesseract.js adds 30MB. M4 enables by default.)
 */
export interface AssetIssue {
  asset: string;
  kind: 'missing-alt' | 'placeholder-alt' | 'missing-svg-title' | 'garbled-text';
  message: string;
}

export interface AssetCheckInput {
  /** Asset slot/id for reporting. */
  id: string;
  /** Mime type. */
  mime: string;
  /** Raw bytes (or string for SVG). */
  contents: string | Uint8Array;
  /** Alt text supplied by source. */
  altText?: string;
}

const PLACEHOLDER_ALT = /^(image|picture|photo|placeholder|untitled|unnamed|asset)$/i;

export function checkAssets(assets: AssetCheckInput[]): AssetIssue[] {
  const issues: AssetIssue[] = [];
  for (const a of assets) {
    if (!a.altText || a.altText.trim().length === 0) {
      issues.push({ asset: a.id, kind: 'missing-alt', message: 'asset has no alt text' });
    } else if (PLACEHOLDER_ALT.test(a.altText.trim())) {
      issues.push({
        asset: a.id,
        kind: 'placeholder-alt',
        message: `alt text "${a.altText}" is a placeholder; describe the image meaningfully`,
      });
    }

    if (a.mime === 'image/svg+xml') {
      const svg = typeof a.contents === 'string' ? a.contents : new TextDecoder().decode(a.contents);
      if (!/<title[\s>]/i.test(svg)) {
        issues.push({
          asset: a.id,
          kind: 'missing-svg-title',
          message: 'SVG must contain a <title> for screen readers',
        });
      }
    }
  }
  return issues;
}

/**
 * OCR hook — pluggable. Default no-op. Pass a real OCR fn (e.g. tesseract.js)
 * from the calling code if/when you want garbled-text checks.
 */
export type OcrFn = (image: Uint8Array) => Promise<string>;

export async function checkGarbledText(
  assets: AssetCheckInput[],
  ocr: OcrFn,
  expectedTextHint?: string,
): Promise<AssetIssue[]> {
  const issues: AssetIssue[] = [];
  for (const a of assets) {
    if (!a.mime.startsWith('image/') || a.mime === 'image/svg+xml') continue;
    const bytes = typeof a.contents === 'string' ? new TextEncoder().encode(a.contents) : a.contents;
    try {
      const recognized = await ocr(bytes);
      if (looksGarbled(recognized, expectedTextHint)) {
        issues.push({
          asset: a.id,
          kind: 'garbled-text',
          message: `OCR detected garbled text: "${recognized.slice(0, 40)}"`,
        });
      }
    } catch {
      // OCR failure is not fatal
    }
  }
  return issues;
}

function looksGarbled(text: string, expected?: string): boolean {
  const cleaned = text.trim();
  if (cleaned.length === 0) return false;
  if (expected && cleaned.toLowerCase().includes(expected.toLowerCase())) return false;
  // Heuristic: high ratio of non-letters or mid-word case flips
  const nonLetter = cleaned.replace(/[a-z]/gi, '').length / cleaned.length;
  if (nonLetter > 0.4) return true;
  const midCase = /\b[A-Z][a-z]+[A-Z]\w*\b/.test(cleaned);
  return midCase;
}
