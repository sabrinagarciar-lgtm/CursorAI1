
## Exercise 6 — Multi-step Registration Form

**Feature:** Multi-step registration form (Exercise 6)  
**Spec file:** `e2e/tests/registration.spec.ts`  
**Page object:** `e2e/pages/RegistrationPage.ts`  
**Date run:** 2026-04-22  
**Command:** `npx playwright test e2e/tests/registration.spec.ts --project desktop-chrome`

### Result

| Metric | Value |
|---|---|
| Tests | **5** |
| Passed | **5** |
| Failed | **0** |
| Project | `desktop-chrome` |
| Duration | **~2.2 seconds** |

### Covered scenarios

| Test | Area covered | Result |
|---|---|---|
| field validation shows required, format, and length errors | Required validation, format validation, length constraints, `aria-invalid` checks | PASS |
| navigates next and previous between steps while preserving values | Step navigation (`Next` / `Previous`) and value persistence between steps | PASS |
| submits successfully with valid data | Submission success state and status messaging | PASS |
| shows submission error state when backend simulation fails | Submission failure path and error status messaging | PASS |
| includes accessible labels and error announcement regions | Label associations, `role="alert"`, `role="status"`, `aria-live`, form `aria-describedby`, progressbar ARIA | PASS |

### Notes

- This addendum reflects the targeted Exercise 6 run on Chrome desktop.
- Full project matrix (`desktop-firefox`, `desktop-webkit`, `tablet-chrome`, `mobile-chrome`, `mobile-webkit`) was not executed for this addendum.
