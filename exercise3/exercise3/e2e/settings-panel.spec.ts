import { expect, test, type Page } from '@playwright/test';

async function htmlHasDarkClass(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.classList.contains('dark'));
}

test.describe('Exercise 3 — Settings panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Initial / empty state', () => {
    test('shows no validation alerts and empty status message', async ({ page }) => {
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('#settings-form-status')).toHaveText('');
    });

    test('profile tab panel is visible with pre-filled display name', async ({ page }) => {
      await expect(page.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByLabel('Display name')).toHaveValue('Alex Rivera');
    });
  });

  test.describe('Profile', () => {
    test('saves valid profile data and shows success status', async ({ page }) => {
      await page.getByLabel('Display name').fill('Jordan Lee');
      await page.getByRole('textbox', { name: 'Email' }).fill('jordan@example.com');
      await page.getByLabel('Bio').fill('Builder of accessible UIs.');
      await page.getByLabel('Time zone').selectOption('europe-london');

      await page.getByRole('button', { name: 'Save changes' }).click();

      await expect(page.locator('#settings-form-status')).toContainText('saved');
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.getByLabel('Display name')).toHaveValue('Jordan Lee');
      await expect(page.getByLabel('Time zone')).toHaveValue('europe-london');
    });

    test('shows error when display name is empty (required field)', async ({ page }) => {
      await page.getByLabel('Display name').fill('');
      await page.getByRole('button', { name: 'Save changes' }).click();

      await expect(page.getByRole('alert')).toContainText('Display name is required');
      await expect(page.locator('#settings-form-status')).toContainText('Fix the highlighted fields');
      await expect(page.getByLabel('Display name')).toHaveAttribute('aria-invalid', 'true');

      await page.getByLabel('Display name').fill('Valid Name');
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('#settings-form-status')).toContainText('saved');
    });

    test('shows email validation error for invalid format', async ({ page }) => {
      await page.getByLabel('Display name').fill('Taylor Kim');
      await page.getByRole('textbox', { name: 'Email' }).fill('not-an-email');
      await page.getByRole('button', { name: 'Save changes' }).click();

      await expect(page.getByRole('alert')).toContainText('valid email');
      await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#settings-form-status')).toContainText('Fix the highlighted fields');
    });

    test('shows bio validation error when over 280 characters', async ({ page }) => {
      const bio = page.getByLabel('Bio');
      await bio.evaluate((el: HTMLTextAreaElement) => el.removeAttribute('maxlength'));
      await bio.fill('x'.repeat(281));

      await page.getByRole('button', { name: 'Save changes' }).click();

      await expect(page.getByRole('alert')).toContainText('280');
      await expect(page.getByLabel('Bio')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test.describe('Notifications', () => {
    test('updates toggles and digest frequency then saves successfully', async ({ page }) => {
      await page.getByRole('tab', { name: 'Notifications' }).click();

      const digest = page.getByRole('switch', { name: 'Email digest' });
      await digest.click();
      await expect(digest).toHaveAttribute('aria-checked', 'false');

      await page.getByRole('switch', { name: 'Push alerts' }).click();
      await expect(page.getByRole('switch', { name: 'Push alerts' })).toHaveAttribute(
        'aria-checked',
        'true'
      );

      await page.getByRole('switch', { name: 'Product updates' }).click();
      await expect(page.getByRole('switch', { name: 'Product updates' })).toHaveAttribute(
        'aria-checked',
        'true'
      );

      await page.getByLabel('Digest frequency').selectOption('monthly');
      await expect(page.getByLabel('Digest frequency')).toHaveValue('monthly');

      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.locator('#settings-form-status')).toContainText('saved');
    });
  });

  test.describe('Privacy', () => {
    test('updates visibility and toggles then saves', async ({ page }) => {
      await page.getByRole('tab', { name: 'Privacy' }).click();

      await page.getByLabel('Who can see your profile').selectOption('connections');
      await expect(page.getByLabel('Who can see your profile')).toHaveValue('connections');

      const searchToggle = page.getByRole('switch', { name: 'Appear in search' });
      await searchToggle.click();
      await expect(searchToggle).toHaveAttribute('aria-checked', 'false');

      const usageToggle = page.getByRole('switch', { name: 'Share anonymized usage' });
      await usageToggle.click();
      await expect(usageToggle).toHaveAttribute('aria-checked', 'true');

      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.locator('#settings-form-status')).toContainText('saved');
    });
  });

  test.describe('Appearance & theme', () => {
    test('applies dark and light theme on the document root', async ({ page }) => {
      await page.getByRole('tab', { name: 'Appearance' }).click();

      await page.getByLabel('Theme').selectOption('dark');
      expect(await htmlHasDarkClass(page)).toBe(true);

      await page.getByLabel('Theme').selectOption('light');
      expect(await htmlHasDarkClass(page)).toBe(false);
    });

    test('system theme follows prefers-color-scheme', async ({ page }) => {
      await page.getByRole('tab', { name: 'Appearance' }).click();
      await page.getByLabel('Theme').selectOption('system');

      const prefersDark = await page.evaluate(
        () => window.matchMedia('(prefers-color-scheme: dark)').matches
      );
      expect(await htmlHasDarkClass(page)).toBe(prefersDark);
    });

    test('density and reduce motion can be changed and saved', async ({ page }) => {
      await page.getByRole('tab', { name: 'Appearance' }).click();

      await page.getByLabel('Density').selectOption('compact');
      await page.getByRole('switch', { name: 'Reduce motion' }).click();

      await expect(page.getByLabel('Density')).toHaveValue('compact');
      await expect(page.getByRole('switch', { name: 'Reduce motion' })).toHaveAttribute(
        'aria-checked',
        'true'
      );

      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.locator('#settings-form-status')).toContainText('saved');
    });
  });

  test.describe('Save / Cancel & error recovery', () => {
    test('cancel restores last saved values after edits', async ({ page }) => {
      await page.getByLabel('Display name').fill('Temporary');
      await page.getByRole('button', { name: 'Cancel' }).click();

      await expect(page.getByLabel('Display name')).toHaveValue('Alex Rivera');
      await expect(page.locator('#settings-form-status')).toContainText('discarded');
    });

    test('after save error, correcting input clears error state on next save', async ({
      page,
    }) => {
      await page.getByLabel('Display name').fill('');
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByRole('alert')).toHaveCount(1);

      await page.getByLabel('Display name').fill('Recovery User');
      await page.getByRole('textbox', { name: 'Email' }).fill('recovery@example.com');
      await page.getByRole('button', { name: 'Save changes' }).click();

      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('#settings-form-status')).toContainText('saved');
    });
  });

  /**
   * Exercise 3 uses section tabs instead of paginated lists; keyboard tab navigation covers
   * sequential “pages” through settings (acceptance-style pagination UX).
   */
  test.describe('Tab navigation across sections', () => {
    test('keyboard arrows move selection across tabs; End focuses last section', async ({
      page,
    }) => {
      await page.getByRole('tab', { name: 'Profile' }).focus();
      await expect(page.getByRole('tab', { name: 'Profile' })).toBeFocused();

      const order = ['Profile', 'Notifications', 'Privacy', 'Appearance'] as const;

      for (let i = 1; i < order.length; i++) {
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('tab', { name: order[i] })).toHaveAttribute(
          'aria-selected',
          'true'
        );
        await expect(page.getByRole('tab', { name: order[i] })).toBeFocused();
      }

      await page.keyboard.press('Home');
      await expect(page.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      await page.getByRole('tab', { name: 'Profile' }).focus();
      await page.keyboard.press('ArrowLeft');
      await expect(page.getByRole('tab', { name: 'Appearance' })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      await page.keyboard.press('End');
      await expect(page.getByRole('tab', { name: 'Appearance' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    test('each tab exposes its panel content when selected', async ({ page }) => {
      await page.getByRole('tab', { name: 'Notifications' }).click();
      await expect(page.getByRole('tabpanel', { name: /notifications/i })).toBeVisible();
      await expect(page.getByRole('switch', { name: 'Email digest' })).toBeVisible();

      await page.getByRole('tab', { name: 'Privacy' }).click();
      await expect(page.getByLabel('Who can see your profile')).toBeVisible();

      await page.getByRole('tab', { name: 'Appearance' }).click();
      await expect(page.getByLabel('Theme')).toBeVisible();
    });
  });
});
