import pytest

from app.services.payment import process_payment
from app.utils.security import (
    contains_sql_injection,
    luhn_check,
    sanitize_text,
    validate_card_number,
    validate_cvv,
    validate_email,
    validate_expiry,
)


@pytest.mark.unit
class TestSecurityUtilities:
    @pytest.mark.parametrize(
        "value,expected",
        [
            ("Jane Doe", False),
            ("'; DROP TABLE orders;--", True),
            ("1 OR 1=1", True),
            ("admin'--", True),
        ],
    )
    def test_sql_injection_detection(self, value, expected):
        assert contains_sql_injection(value) is expected

    @pytest.mark.parametrize(
        "card,valid",
        [
            ("4111111111111111", True),
            ("4111111111111112", False),
            ("378282246310005", True),
        ],
    )
    def test_luhn_validation(self, card, valid):
        assert luhn_check(card) is valid

    def test_validate_card_number_strips_non_digits(self):
        assert validate_card_number("4111 1111 1111 1111") == "4111111111111111"

    def test_validate_cvv_three_and_four_digits(self):
        assert validate_cvv("123") == "123"
        assert validate_cvv("1234") == "1234"

    def test_validate_cvv_invalid_length_raises(self):
        with pytest.raises(ValueError, match="CVV"):
            validate_cvv("12")

    def test_validate_expiry_accepts_future_date(self):
        month, year = validate_expiry("12/30")
        assert month == 12
        assert year == 2030

    def test_validate_expiry_rejects_past_date(self):
        with pytest.raises(ValueError, match="expired"):
            validate_expiry("01/20")

    def test_validate_email_normalizes_and_validates(self):
        assert validate_email("Jane@Example.COM") == "jane@example.com"

    def test_sanitize_text_rejects_injection(self):
        with pytest.raises(ValueError, match="unsafe"):
            sanitize_text("Robert'); DROP TABLE orders;--")


@pytest.mark.unit
class TestPaymentService:
    def test_successful_payment_authorization(self):
        result = process_payment(
            card_number="4111111111111111",
            expiry="12/30",
            cvv="123",
            cardholder_name="Jane Doe",
            amount=49.99,
        )
        assert result.success is True
        assert result.last4 == "1111"

    def test_zero_amount_payment_rejected(self):
        result = process_payment(
            card_number="4111111111111111",
            expiry="12/30",
            cvv="123",
            cardholder_name="Jane Doe",
            amount=0,
        )
        assert result.success is False

    def test_declined_test_card(self):
        result = process_payment(
            card_number="4000000000000002",
            expiry="12/30",
            cvv="123",
            cardholder_name="Jane Doe",
            amount=10,
        )
        assert result.success is False
        assert "declined" in result.message.lower()
