from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import CurrentUser
from app.models import Contact, Deal, Organization
from app.schemas import DealCreate, DealRead, DealUpdate

router = APIRouter(prefix="/deals", tags=["deals"])


def _ensure_fks(
    db: Session,
    organization_id: int | None,
    contact_id: int | None,
) -> None:
    if organization_id is not None and db.get(Organization, organization_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="organization_id does not reference an existing organization",
        )
    if contact_id is not None and db.get(Contact, contact_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="contact_id does not reference an existing contact",
        )


@router.get("", response_model=list[DealRead])
def list_deals(
    _: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[Deal]:
    return list(db.scalars(select(Deal).order_by(Deal.id)))


@router.post("", response_model=DealRead, status_code=status.HTTP_201_CREATED)
def create_deal(
    _: CurrentUser,
    body: DealCreate,
    db: Annotated[Session, Depends(get_db)],
) -> Deal:
    _ensure_fks(db, body.organization_id, body.contact_id)
    deal = Deal(
        title=body.title,
        amount=body.amount,
        stage=body.stage,
        organization_id=body.organization_id,
        contact_id=body.contact_id,
    )
    db.add(deal)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid foreign key",
        ) from None
    db.refresh(deal)
    return deal


@router.get("/{deal_id}", response_model=DealRead)
def get_deal(
    _: CurrentUser,
    deal_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> Deal:
    deal = db.get(Deal, deal_id)
    if deal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return deal


@router.patch("/{deal_id}", response_model=DealRead)
def update_deal(
    _: CurrentUser,
    deal_id: int,
    body: DealUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Deal:
    deal = db.get(Deal, deal_id)
    if deal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    data = body.model_dump(exclude_unset=True)
    org_id = data.get("organization_id", deal.organization_id)
    cid = data.get("contact_id", deal.contact_id)
    if "organization_id" in data or "contact_id" in data:
        _ensure_fks(db, org_id, cid)
    if not data:
        return deal
    for key, value in data.items():
        setattr(deal, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid foreign key",
        ) from None
    db.refresh(deal)
    return deal


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deal(
    _: CurrentUser,
    deal_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    deal = db.get(Deal, deal_id)
    if deal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    db.delete(deal)
    db.commit()
