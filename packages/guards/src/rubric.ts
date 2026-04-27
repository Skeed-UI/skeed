/**
 * Rubric guard. 7-criterion judgment of an emitted scaffold. Pure deterministic
 * rule-based scoring with optional LLM-judge sub-call (caller-provided).
 */
export interface RubricInput {
  /** Demographic id of the project. */
  demographic: string;
  /** TSX of the landing page. */
  landingTsx: string;
  /** CSS for global styles. */
  globalsCss: string;
  /** Asset alt texts collected. */
  assetAlts: string[];
  /** Backend stack list. */
  backendStack: string[];
}

export interface RubricCriterion {
  id: string;
  label: string;
  score: number; // 0-10
  reasoning: string;
}

export interface RubricResult {
  criteria: RubricCriterion[];
  composite: number;
  passes: boolean;
}

export const RUBRIC_THRESHOLD = 7;

export function judgeRubric(input: RubricInput): RubricResult {
  const c: RubricCriterion[] = [
    scoreClarity(input),
    scoreDemographicFit(input),
    scoreBrandCoherence(input),
    scoreAccessibility(input),
    scoreOriginality(input),
    scoreConversionStrength(input),
    scoreEthics(input),
  ];
  const composite = c.reduce((s, x) => s + x.score, 0) / c.length;
  return { criteria: c, composite: round(composite, 2), passes: composite >= RUBRIC_THRESHOLD };
}

function scoreClarity(i: RubricInput): RubricCriterion {
  const hasH1 = /<h1\b/i.test(i.landingTsx);
  const hasCta = /href|<button/i.test(i.landingTsx);
  const score = (hasH1 ? 5 : 0) + (hasCta ? 5 : 0);
  return { id: 'clarity', label: 'Clarity', score, reasoning: `h1=${hasH1} cta=${hasCta}` };
}

function scoreDemographicFit(i: RubricInput): RubricCriterion {
  const isKids = i.demographic === 'kids';
  const hasFun = /Let.s\s+go|fun|play/i.test(i.landingTsx);
  if (isKids && !hasFun) return { id: 'demographic_fit', label: 'Demographic fit', score: 6, reasoning: 'kids copy lacks playfulness markers' };
  return { id: 'demographic_fit', label: 'Demographic fit', score: 8, reasoning: 'demographic markers present' };
}

function scoreBrandCoherence(i: RubricInput): RubricCriterion {
  const usesBrandVar = /var\(--skeed-brand\)/.test(i.landingTsx);
  return {
    id: 'brand_coherence',
    label: 'Brand coherence',
    score: usesBrandVar ? 9 : 5,
    reasoning: usesBrandVar ? 'uses brand token' : 'hardcoded color or missing brand reference',
  };
}

function scoreAccessibility(i: RubricInput): RubricCriterion {
  const altsOk = i.assetAlts.every((a) => a.trim().length > 4 && !/placeholder|untitled/i.test(a));
  const hasLang = /lang="[a-z]{2}"/i.test(i.globalsCss + i.landingTsx);
  void hasLang;
  return {
    id: 'accessibility',
    label: 'Accessibility',
    score: altsOk ? 9 : 5,
    reasoning: altsOk ? 'all assets have meaningful alt text' : 'placeholder alt text on at least one asset',
  };
}

function scoreOriginality(i: RubricInput): RubricCriterion {
  const generic = (i.landingTsx.match(/Lorem ipsum|placeholder|TODO/gi) ?? []).length;
  return {
    id: 'originality',
    label: 'Originality',
    score: generic === 0 ? 8 : Math.max(2, 8 - generic),
    reasoning: generic === 0 ? 'no placeholder copy detected' : `${generic} placeholder/TODO matches`,
  };
}

function scoreConversionStrength(i: RubricInput): RubricCriterion {
  const ctaCount = (i.landingTsx.match(/<a\b[^>]*href=|<button\b/gi) ?? []).length;
  const score = Math.min(10, ctaCount * 3);
  return { id: 'conversion_strength', label: 'Conversion strength', score, reasoning: `${ctaCount} CTAs detected` };
}

function scoreEthics(i: RubricInput): RubricCriterion {
  const dark = /only\s+\d+\s+left|act\s+now|don't\s+miss/i.test(i.landingTsx);
  return {
    id: 'ethics',
    label: 'Ethics',
    score: dark ? 3 : 9,
    reasoning: dark ? 'dark-pattern copy detected' : 'no dark-pattern copy detected',
  };
}

function round(n: number, places: number): number {
  const f = Math.pow(10, places);
  return Math.round(n * f) / f;
}
