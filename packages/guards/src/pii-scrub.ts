/**
 * PII-scrub guard. Pure regex — no LLM. Catches the common shapes of accidental
 * PII leakage in generated copy, user stories, and code samples.
 */
export interface PiiHit {
  kind: 'email' | 'phone' | 'ssn' | 'credit-card' | 'ipv4';
  value: string;
  index: number;
}

const PLACEHOLDER_EMAIL =
  /^(you|me|user|name|test|example|placeholder|admin)@(example|test|placeholder|domain)\.(com|org|net)$/i;

const PATTERNS: Array<{
  kind: PiiHit['kind'];
  pattern: RegExp;
  postCheck?: (m: string) => boolean;
}> = [
  {
    kind: 'email',
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    postCheck: (m) => !PLACEHOLDER_EMAIL.test(m),
  },
  { kind: 'phone', pattern: /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g },
  { kind: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { kind: 'credit-card', pattern: /\b(?:\d[ -]*?){13,16}\b/g, postCheck: luhnCheck },
  { kind: 'ipv4', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
];

export function scrubPii(text: string): { hits: PiiHit[]; redacted: string } {
  const hits: PiiHit[] = [];
  let redacted = text;
  for (const { kind, pattern, postCheck } of PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null = pattern.exec(text);
    while (m !== null) {
      const value = m[0];
      if (!postCheck || postCheck(value)) {
        hits.push({ kind, value, index: m.index });
        redacted = redacted.replace(value, `[REDACTED:${kind}]`);
      }
      m = pattern.exec(text);
    }
  }
  return { hits, redacted };
}

function luhnCheck(card: string): boolean {
  const digits = card.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
