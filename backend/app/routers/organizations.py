from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import CurrentUser
from app.models import Organization
from app.schemas import OrganizationCreate, OrganizationRead, OrganizationUpdate

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("", response_model=list[OrganizationRead])
def list_organizations(
    _: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[Organization]:
    return list(db.scalars(select(Organization).order_by(Organization.id)))


@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
def create_organization(
    _: CurrentUser,
    body: OrganizationCreate,
    db: Annotated[Session, Depends(get_db)],
) -> Organization:
    org = Organization(name=body.name, website=body.website)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganizationRead)
def get_organization(
    _: CurrentUser,
    org_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> Organization:
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return org


@router.patch("/{org_id}", response_model=OrganizationRead)
def update_organization(
    _: CurrentUser,
    org_id: int,
    body: OrganizationUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Organization:
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    data = body.model_dump(exclude_unset=True)
    if not data:
        return org
    for key, value in data.items():
        setattr(org, key, value)
    db.commit()
    db.refresh(org)
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    _: CurrentUser,
    org_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    db.delete(org)
    db.commit()
