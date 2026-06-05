import re
from datetime import datetime, timezone


EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
SQL_INJECTION_PATTERN = re.compile(
    r"(--|;|'|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b)",
    re.IGNORECASE,
)


def contains_sql_injection(value: str) -> bool:
    return bool(SQL_INJECTION_PATTERN.search(value.strip()))


def sanitize_text(value: str, max_length: int = 200) -> str:
    cleaned = value.strip()
    if len(cleaned) > max_length:
        raise ValueError(f"Value exceeds maximum length of {max_length} characters.")
    if contains_sql_injection(cleaned):
        raise ValueError("Potentially unsafe input detected.")
    return cleaned


def validate_email(email: str) -> str:
    cleaned = sanitize_text(email, max_length=254).lower()
    if not EMAIL_PATTERN.match(cleaned):
        raise ValueError("Invalid email address.")
    return cleaned


def luhn_check(card_number: str) -> bool:
    digits = [int(d) for d in card_number if d.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    parity = len(digits) % 2
    for index, digit in enumerate(digits):
        if index % 2 == parity:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
    return checksum % 10 == 0


def validate_card_number(card_number: str) -> str:
    digits_only = re.sub(r"\D", "", card_number)
    if not digits_only:
        raise ValueError("Card number is required.")
    if contains_sql_injection(card_number):
        raise ValueError("Invalid card number format.")
    if not luhn_check(digits_only):
        raise ValueError("Invalid card number.")
    return digits_only


def validate_cvv(cvv: str) -> str:
    cleaned = re.sub(r"\D", "", cvv)
    if len(cleaned) not in (3, 4):
        raise ValueError("CVV must be 3 or 4 digits.")
    return cleaned


def validate_expiry(expiry: str) -> tuple[int, int]:
    cleaned = expiry.strip()
    match = re.match(r"^(0[1-9]|1[0-2])\s*/\s*(\d{2})$", cleaned)
    if not match:
        raise ValueError("Expiry must be in MM/YY format.")
    month = int(match.group(1))
    year = 2000 + int(match.group(2))
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if year < now.year or (year == now.year and month < now.month):
        raise ValueError("Card has expired.")
    return month, year


def validate_cardholder_name(name: str) -> str:
    cleaned = sanitize_text(name, max_length=100)
    if len(cleaned) < 2:
        raise ValueError("Cardholder name is too short.")
    if not re.match(r"^[a-zA-Z\s'.-]+$", cleaned):
        raise ValueError("Cardholder name contains invalid characters.")
    return cleaned
