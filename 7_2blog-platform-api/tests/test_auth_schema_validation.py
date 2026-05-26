import pytest

from marshmallow import ValidationError

from app.schemas.auth import RegisterSchema


def test_register_rejects_weak_password():
    schema = RegisterSchema()
    with pytest.raises(ValidationError):
        schema.load({"name": "A", "email": "z@example.com", "password": "short"})


def test_register_rejects_password_without_digit():
    schema = RegisterSchema()
    with pytest.raises(ValidationError):
        schema.load({"name": "Name", "email": "x@example.com", "password": "NoDigitsHere!Aa"})


def test_register_accepts_strong_password():
    schema = RegisterSchema()
    data = schema.load(
        {"name": "Valid User", "email": "ok@example.com", "password": "GoodPass456"}
    )
    assert data["password"] == "GoodPass456"
    assert data["email"] == "ok@example.com"


def test_manual_pagination_totals_keyword():
    from app.schemas.common import manual_pagination_meta

    meta = manual_pagination_meta(total=25, page=1, per_page=10, keyword="hello")
    assert meta["total"] == 25
    assert meta["keyword"] == "hello"
