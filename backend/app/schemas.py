from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class OrganizationBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    website: str | None = Field(default=None, max_length=512)


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    website: str | None = Field(default=None, max_length=512)


class OrganizationRead(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class ContactBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=128)
    last_name: str = Field(min_length=1, max_length=128)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=64)
    organization_id: int | None = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=128)
    last_name: str | None = Field(default=None, min_length=1, max_length=128)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=64)
    organization_id: int | None = None


class ContactRead(ContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class DealBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    amount: Decimal = Field(ge=0)
    stage: str = Field(min_length=1, max_length=64)
    organization_id: int | None = None
    contact_id: int | None = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    amount: Decimal | None = Field(default=None, ge=0)
    stage: str | None = Field(default=None, min_length=1, max_length=64)
    organization_id: int | None = None
    contact_id: int | None = None


class DealRead(DealBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
