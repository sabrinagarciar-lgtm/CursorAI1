import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage';

test.describe('Exercise 6 - Multi-step registration form', () => {
  let registration: RegistrationPage;

  test.beforeEach(async ({ page }) => {
    registration = new RegistrationPage(page);
    await registration.goto();
  });

  test('field validation shows required, format, and length errors', async () => {
    await registration.nextButton.click();

    await expect(registration.errorAlert).toBeVisible();
    await expect(registration.errorAlert).toContainText('First name is required.');
    await expect(registration.errorAlert).toContainText('Last name is required.');
    await expect(registration.errorAlert).toContainText('Email is required.');
    await expect(registration.errorAlert).toContainText('Password is required.');

    await registration.fillStepOne({
      firstName: 'A',
      lastName: 'B',
      email: 'not-an-email',
      password: '123',
    });
    await registration.nextButton.click();

    await expect(registration.errorAlert).toContainText(
      'First name must be between 2 and 50 characters.',
    );
    await expect(registration.errorAlert).toContainText(
      'Last name must be between 2 and 50 characters.',
    );
    await expect(registration.errorAlert).toContainText('Enter a valid email address.');
    await expect(registration.errorAlert).toContainText(
      'Password must be between 8 and 64 characters.',
    );

    await expect(registration.field('First name')).toHaveAttribute('aria-invalid', 'true');
    await expect(registration.field('Email address')).toHaveAttribute('aria-invalid', 'true');
  });

  test('navigates next and previous between steps while preserving values', async ({ page }) => {
    await registration.fillStepOne({
      firstName: 'Taylor',
      lastName: 'Smith',
      email: 'taylor@example.com',
      password: 'Password123',
    });

    await registration.nextButton.click();
    await expect(page.locator('legend').filter({ hasText: 'Profile Information' })).toBeVisible();
    await expect(page.getByText('Step 2 of 3')).toBeVisible();

    await registration.previousButton.click();
    await expect(page.locator('legend').filter({ hasText: 'Account Details' })).toBeVisible();
    await expect(registration.field('First name')).toHaveValue('Taylor');

    await registration.nextButton.click();
    await registration.fillStepTwo({
      username: 'tay_smith',
      phone: '+1 555 555 1000',
    });
    await registration.nextButton.click();
    await expect(page.locator('legend').filter({ hasText: 'Additional Details' })).toBeVisible();
    await expect(page.getByText('Step 3 of 3')).toBeVisible();

    await registration.previousButton.click();
    await expect(page.locator('legend').filter({ hasText: 'Profile Information' })).toBeVisible();
    await expect(registration.field('Username')).toHaveValue('tay_smith');
  });

  test('submits successfully with valid data', async () => {
    await registration.goToStepThree();
    await registration.fillStepThree({
      country: 'United States',
      bio: 'Frontend developer and accessibility advocate.',
    });

    await registration.submitButton.click();
    await expect(registration.statusMessage).toContainText('Submitting registration...');
    await expect(registration.statusMessage).toContainText(
      'Registration complete. Welcome, Sarah!',
    );
  });

  test('shows submission error state when backend simulation fails', async () => {
    await registration.goToStepThree('qa-error@example.com');
    await registration.fillStepThree({
      country: 'Canada',
      bio: 'Testing submission failure path.',
    });

    await registration.submitButton.click();
    await expect(registration.statusMessage).toContainText('Submitting registration...');
    await expect(registration.statusMessage).toContainText(
      'Registration failed. Try a different email and submit again.',
    );
  });

  test('includes accessible labels and error announcement regions', async ({ page }) => {
    await expect(registration.field('First name')).toBeVisible();
    await expect(registration.field('Last name')).toBeVisible();
    await expect(registration.field('Email address')).toBeVisible();
    await expect(registration.field('Password')).toBeVisible();

    await registration.nextButton.click();
    await expect(registration.errorAlert).toBeVisible();
    await expect(registration.errorAlert).toContainText('Please fix the following:');

    await expect(registration.errorAlert).toHaveAttribute('role', 'alert');
    await expect(registration.statusMessage).toHaveAttribute('role', 'status');
    await expect(registration.statusMessage).toHaveAttribute('aria-live', 'polite');
    await expect(registration.form).toHaveAttribute('aria-describedby', 'form-status');

    await registration.goToStepTwo();
    await expect(registration.field('Username')).toBeVisible();
    await expect(registration.field('Phone number')).toBeVisible();

    await registration.fillStepTwo({
      username: 'valid_user',
      phone: '+1 (555) 111-2222',
    });
    await registration.nextButton.click();
    await expect(registration.field('Country')).toBeVisible();
    await expect(registration.field('Short bio (optional)')).toBeVisible();

    await expect(registration.progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});
