/** E2E test data aligned with backend seed catalog and test cards. */
export const E2E_CHECKOUT = {
  customer: {
    name: "QA Automation User",
    email: "qa.automation@shopease.test",
  },
  payment: {
    cardNumber: "4111111111111111",
    expiry: "12/30",
    cvv: "123",
    cardholderName: "QA Automation User",
  },
  discount: {
    valid: "SAVE10",
    invalid: "NOTREAL",
  },
} as const;
