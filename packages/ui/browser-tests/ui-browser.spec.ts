import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

function cssTimesToMs(value: string): number[] {
  return value.split(',').map((time) => {
    const normalized = time.trim();

    if (normalized.endsWith('ms')) {
      return Number.parseFloat(normalized);
    }

    if (normalized.endsWith('s')) {
      return Number.parseFloat(normalized) * 1000;
    }

    return Number.parseFloat(normalized);
  });
}

test.describe('@skeed/ui browser QA', () => {
  test.beforeEach(async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Skeed UI browser QA' })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('has no detectable axe violations in the rendered flagship gallery', async ({ page }) => {
    const results = await new AxeBuilder({ page }).include('[data-testid="qa-shell"]').analyze();

    expect(results.violations).toEqual([]);
  });

  test('supports keyboard and form interaction on representative controls', async ({ page }) => {
    await page.getByLabel('Runner name').fill('Maya Runner');
    await expect(page.getByLabel('Runner name')).toHaveValue('Maya Runner');

    await page.getByRole('tab', { name: 'Tokens' }).click();
    await expect(page.getByRole('tabpanel')).toContainText('Tailwind 3 tokens compile');

    await expect(page.getByRole('radio', { name: 'Productivity', exact: true })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Dense controls/ })).toHaveCount(0);

    await page.getByRole('radio', { name: 'Health', exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: 'Productivity', exact: true })).toBeChecked();

    await page.getByRole('checkbox', { name: 'Use CSS-first micro-interactions' }).uncheck();
    await expect(
      page.getByRole('checkbox', { name: 'Use CSS-first micro-interactions' }),
    ).not.toBeChecked();

    await page.getByRole('slider', { name: 'Motion intensity' }).fill('64');
    await expect(page.getByRole('slider', { name: 'Motion intensity' })).toHaveValue('64');

    const switchHitTarget = await page
      .getByRole('checkbox', { name: 'Use CSS-first micro-interactions' })
      .boundingBox();
    expect(switchHitTarget?.width).toBeGreaterThanOrEqual(44);
    expect(switchHitTarget?.height).toBeGreaterThanOrEqual(44);

    const choiceHitTarget = await page
      .getByRole('radio', { name: 'Productivity', exact: true })
      .boundingBox();
    expect(choiceHitTarget?.width).toBeGreaterThanOrEqual(44);
    expect(choiceHitTarget?.height).toBeGreaterThanOrEqual(44);

    await expect(page.getByRole('menu', { name: 'Component actions' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Install component' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Semantic search' })).toBeVisible();

    await page.getByRole('button', { name: 'Show accessible modal' }).click();
    await expect(page.getByRole('dialog', { name: 'Accessible modal' })).toBeVisible();
    await page.getByRole('button', { name: 'Close modal' }).click();
    await expect(page.getByRole('dialog', { name: 'Accessible modal' })).toBeHidden();
  });

  test('does not overflow the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 390 });
    await page.goto('/');

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return Math.ceil(root.scrollWidth - window.innerWidth);
    });

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('honors reduced motion for Skeed micro-interactions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const transitionDurations = await page
      .getByTestId('motion-card')
      .evaluate((element) => window.getComputedStyle(element).transitionDuration)
      .then(cssTimesToMs);

    expect(Math.max(...transitionDurations)).toBeLessThanOrEqual(1);

    await expect(page.locator('.animate-ping')).toHaveCSS('animation-name', 'none');
  });

  test('captures responsive smoke screenshots as browser artifacts', async ({ page }, testInfo) => {
    await page.screenshot({
      animations: 'disabled',
      fullPage: true,
      path: testInfo.outputPath(`${testInfo.project.name}-full-page.png`),
    });
  });
});
