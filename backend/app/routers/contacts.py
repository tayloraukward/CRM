from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import CurrentUser
from app.models import Contact, Organization
from app.schemas import ContactCreate, ContactRead, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])


def _ensure_org_exists(db: Session, organization_id: int | None) -> None:
    if organization_id is None:
        return
    if db.get(Organization, organization_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="organization_id does not reference an existing organization",
        )


@router.get("", response_model=list[ContactRead])
def list_contacts(
    _: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    email: str | None = None,
) -> list[Contact]:
    stmt = select(Contact).order_by(Contact.id)
    if email is not None:
        stmt = stmt.where(Contact.email == email)
    return list(db.scalars(stmt))


@router.post("", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
def create_contact(
    _: CurrentUser,
    body: ContactCreate,
    db: Annotated[Session, Depends(get_db)],
) -> Contact:
    _ensure_org_exists(db, body.organization_id)
    contact = Contact(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        phone=body.phone,
        organization_id=body.organization_id,
    )
    db.add(contact)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email already in use or invalid foreign key",
        ) from None
    db.refresh(contact)
    return contact


@router.get("/{contact_id}", response_model=ContactRead)
def get_contact(
    _: CurrentUser,
    contact_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> Contact:
    contact = db.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return contact


@router.patch("/{contact_id}", response_model=ContactRead)
def update_contact(
    _: CurrentUser,
    contact_id: int,
    body: ContactUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Contact:
    contact = db.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    data = body.model_dump(exclude_unset=True)
    if "organization_id" in data:
        _ensure_org_exists(db, data["organization_id"])
    if not data:
        return contact
    for key, value in data.items():
        setattr(contact, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email already in use or invalid foreign key",
        ) from None
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    _: CurrentUser,
    contact_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    contact = db.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    db.delete(contact)
    db.commit()
