import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class RegistrationPage {
  readonly page: Page;

  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly submitButton: Locator;
  readonly statusMessage: Locator;
  readonly errorAlert: Locator;
  readonly form: Locator;
  readonly progressBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.previousButton = page.getByRole('button', { name: 'Previous' });
    this.submitButton = page.getByRole('button', { name: /Submit registration|Submitting/ });
    this.statusMessage = page.locator('#form-status');
    this.errorAlert = page.getByRole('alert');
    this.form = page.locator('form[aria-describedby="form-status"]');
    this.progressBar = page.getByRole('progressbar', {
      name: 'Form completion progress',
    });
  }

  async goto() {
    await this.page.goto('/');
    await expect(
      this.page.getByRole('heading', { name: 'Exercise 6: Multi-Step Registration' }),
    ).toBeVisible();
  }

  field(label: string): Locator {
    return this.page.getByLabel(label);
  }

  async fillStepOne(values?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  }) {
    if (values?.firstName !== undefined) {
      await this.field('First name').fill(values.firstName);
    }
    if (values?.lastName !== undefined) {
      await this.field('Last name').fill(values.lastName);
    }
    if (values?.email !== undefined) {
      await this.field('Email address').fill(values.email);
    }
    if (values?.password !== undefined) {
      await this.field('Password').fill(values.password);
    }
  }

  async fillStepTwo(values?: { username?: string; phone?: string }) {
    if (values?.username !== undefined) {
      await this.field('Username').fill(values.username);
    }
    if (values?.phone !== undefined) {
      await this.field('Phone number').fill(values.phone);
    }
  }

  async fillStepThree(values?: { country?: string; bio?: string }) {
    if (values?.country !== undefined) {
      await this.field('Country').fill(values.country);
    }
    if (values?.bio !== undefined) {
      await this.field('Short bio (optional)').fill(values.bio);
    }
  }

  async goToStepTwo() {
    await this.fillStepOne({
      firstName: 'Sarah',
      lastName: 'Garcia',
      email: 'sarah@example.com',
      password: 'Password123',
    });
    await this.nextButton.click();
    await expect(
      this.page.locator('legend').filter({ hasText: 'Profile Information' }),
    ).toBeVisible();
  }

  async goToStepThree(stepOneEmail = 'sarah@example.com') {
    await this.fillStepOne({
      firstName: 'Sarah',
      lastName: 'Garcia',
      email: stepOneEmail,
      password: 'Password123',
    });
    await this.nextButton.click();
    await this.fillStepTwo({
      username: 'sarah_g',
      phone: '+1 (555) 555-0101',
    });
    await this.nextButton.click();
    await expect(
      this.page.locator('legend').filter({ hasText: 'Additional Details' }),
    ).toBeVisible();
  }
}
