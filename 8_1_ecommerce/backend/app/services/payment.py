from dataclasses import dataclass

from app.utils.security import (
    validate_card_number,
    validate_cardholder_name,
    validate_cvv,
    validate_expiry,
)


@dataclass
class PaymentResult:
    success: bool
    last4: str
    message: str


DECLINED_TEST_CARDS = {
    "4000000000000002",
    "4111111111111112",
}


def process_payment(
    *,
    card_number: str,
    expiry: str,
    cvv: str,
    cardholder_name: str,
    amount: float,
) -> PaymentResult:
    if amount <= 0:
        return PaymentResult(False, "", "Payment amount must be greater than zero.")

    try:
        digits = validate_card_number(card_number)
        validate_expiry(expiry)
        validate_cvv(cvv)
        validate_cardholder_name(cardholder_name)
    except ValueError as exc:
        return PaymentResult(False, "", str(exc))

    if digits in DECLINED_TEST_CARDS:
        return PaymentResult(False, digits[-4:], "Payment declined by issuer.")

    return PaymentResult(True, digits[-4:], "Payment authorized.")
