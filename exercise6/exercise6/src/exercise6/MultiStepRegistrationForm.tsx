import React, { useMemo, useState } from 'react';

type StepIndex = 0 | 1 | 2;

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  phone: string;
  country: string;
  bio: string;
}

type FieldName = keyof FormValues;
type FormErrors = Partial<Record<FieldName, string>>;
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const INITIAL_VALUES: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  username: '',
  phone: '',
  country: '',
  bio: '',
};

const STEP_TITLES = ['Account Details', 'Profile Information', 'Additional Details'] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{10,20}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const isRequired = (value: string): boolean => value.trim().length > 0;

const validateStep = (step: StepIndex, values: FormValues): FormErrors => {
  const errors: FormErrors = {};

  if (step === 0) {
    if (!isRequired(values.firstName)) {
      errors.firstName = 'First name is required.';
    } else if (values.firstName.trim().length < 2 || values.firstName.trim().length > 50) {
      errors.firstName = 'First name must be between 2 and 50 characters.';
    }

    if (!isRequired(values.lastName)) {
      errors.lastName = 'Last name is required.';
    } else if (values.lastName.trim().length < 2 || values.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be between 2 and 50 characters.';
    }

    if (!isRequired(values.email)) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(values.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!isRequired(values.password)) {
      errors.password = 'Password is required.';
    } else if (values.password.length < 8 || values.password.length > 64) {
      errors.password = 'Password must be between 8 and 64 characters.';
    }
  }

  if (step === 1) {
    if (!isRequired(values.username)) {
      errors.username = 'Username is required.';
    } else if (values.username.length < 3 || values.username.length > 20) {
      errors.username = 'Username must be between 3 and 20 characters.';
    } else if (!USERNAME_REGEX.test(values.username)) {
      errors.username = 'Username can contain only letters, numbers, and underscores.';
    }

    if (!isRequired(values.phone)) {
      errors.phone = 'Phone number is required.';
    } else if (!PHONE_REGEX.test(values.phone.trim())) {
      errors.phone = 'Enter a valid phone number.';
    }
  }

  if (step === 2) {
    if (!isRequired(values.country)) {
      errors.country = 'Country is required.';
    } else if (values.country.trim().length < 2 || values.country.trim().length > 56) {
      errors.country = 'Country must be between 2 and 56 characters.';
    }

    if (values.bio.length > 160) {
      errors.bio = 'Bio must be 160 characters or fewer.';
    }
  }

  return errors;
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const MultiStepRegistrationForm: React.FC = () => {
  const [step, setStep] = useState<StepIndex>(0);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const progressValue = useMemo(() => ((step + 1) / STEP_TITLES.length) * 100, [step]);

  const setFieldValue = (field: FieldName, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });

    if (submitState !== 'idle') {
      setSubmitState('idle');
      setSubmitMessage('');
    }
  };

  const runStepValidation = (targetStep: StepIndex) => {
    const stepErrors = validateStep(targetStep, values);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (runStepValidation(step)) {
      setStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1) as StepIndex);
    }
  };

  const handlePrevious = () => {
    setErrors({});
    setSubmitState('idle');
    setSubmitMessage('');
    setStep((prev) => Math.max(prev - 1, 0) as StepIndex);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!runStepValidation(step)) {
      return;
    }

    setSubmitState('submitting');
    setSubmitMessage('Submitting registration...');

    await sleep(700);

    if (values.email.toLowerCase().includes('error')) {
      setSubmitState('error');
      setSubmitMessage('Registration failed. Try a different email and submit again.');
      return;
    }

    setSubmitState('success');
    setSubmitMessage(`Registration complete. Welcome, ${values.firstName.trim()}!`);
  };

  const errorSummary = Object.entries(errors);
  const isFinalStep = step === STEP_TITLES.length - 1;

  return (
    <section className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Exercise 6: Multi-Step Registration</h1>
        <p className="mt-2 text-sm text-slate-600">
          Complete each step to create your account. Use <strong>error</strong> in your email to
          simulate a failed submission.
        </p>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
            <span>
              Step {step + 1} of {STEP_TITLES.length}
            </span>
            <span>{STEP_TITLES[step]}</span>
          </div>
          <div
            className="h-2 rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressValue}
            aria-label="Form completion progress"
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate aria-describedby="form-status">
        {errorSummary.length > 0 && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            <p className="font-semibold">Please fix the following:</p>
            <ul className="mt-2 list-disc pl-5">
              {errorSummary.map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 0 && (
          <fieldset className="space-y-4" aria-labelledby="step-account">
            <legend id="step-account" className="mb-2 text-lg font-semibold text-slate-900">
              Account Details
            </legend>

            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-slate-800">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={values.firstName}
                onChange={(event) => setFieldValue('firstName', event.target.value)}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {errors.firstName && (
                <p id="firstName-error" className="mt-1 text-sm text-red-700">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-slate-800">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={values.lastName}
                onChange={(event) => setFieldValue('lastName', event.target.value)}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {errors.lastName && (
                <p id="lastName-error" className="mt-1 text-sm text-red-700">
                  {errors.lastName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-800">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={values.email}
                onChange={(event) => setFieldValue('email', event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-700">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-800">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={values.password}
                onChange={(event) => setFieldValue('password', event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-700">
                  {errors.password}
                </p>
              )}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-4" aria-labelledby="step-profile">
            <legend id="step-profile" className="mb-2 text-lg font-semibold text-slate-900">
              Profile Information
            </legend>

            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-800">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={values.username}
                onChange={(event) => setFieldValue('username', event.target.value)}
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'username-error' : undefined}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {errors.username && (
                <p id="username-error" className="mt-1 text-sm text-red-700">
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-800">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={values.phone}
                onChange={(event) => setFieldValue('phone', event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {errors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-700">
                  {errors.phone}
                </p>
              )}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-4" aria-labelledby="step-additional">
            <legend id="step-additional" className="mb-2 text-lg font-semibold text-slate-900">
              Additional Details
            </legend>

            <div>
              <label htmlFor="country" className="mb-1 block text-sm font-medium text-slate-800">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                value={values.country}
                onChange={(event) => setFieldValue('country', event.target.value)}
                aria-invalid={Boolean(errors.country)}
                aria-describedby={errors.country ? 'country-error' : undefined}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {errors.country && (
                <p id="country-error" className="mt-1 text-sm text-red-700">
                  {errors.country}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="mb-1 block text-sm font-medium text-slate-800">
                Short bio (optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={values.bio}
                onChange={(event) => setFieldValue('bio', event.target.value)}
                aria-invalid={Boolean(errors.bio)}
                aria-describedby={errors.bio ? 'bio-error' : 'bio-help'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <p id="bio-help" className="mt-1 text-xs text-slate-500">
                {values.bio.length}/160 characters
              </p>
              {errors.bio && (
                <p id="bio-error" className="mt-1 text-sm text-red-700">
                  {errors.bio}
                </p>
              )}
            </div>
          </fieldset>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={step === 0 || submitState === 'submitting'}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            Previous
          </button>

          {!isFinalStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitState === 'submitting'}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            >
              {submitState === 'submitting' ? 'Submitting...' : 'Submit registration'}
            </button>
          )}
        </div>

        <p
          id="form-status"
          className={`mt-4 text-sm ${
            submitState === 'error'
              ? 'text-red-700'
              : submitState === 'success'
                ? 'text-emerald-700'
                : 'text-slate-600'
          }`}
          role="status"
          aria-live="polite"
        >
          {submitMessage}
        </p>
      </form>
    </section>
  );
};

export default MultiStepRegistrationForm;
