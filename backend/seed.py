"""Create tables and seed sample data. Safe to re-run: clears CRM rows and re-seeds."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import delete

from app.db import SessionLocal, engine
from app.models import Base, Contact, Deal, Organization, User
from app.security import hash_password


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.execute(delete(Deal))
        db.execute(delete(Contact))
        db.execute(delete(Organization))
        db.execute(delete(User))
        db.commit()

        user = User(username="demo", password_hash=hash_password("password"))
        db.add(user)

        org_acme = Organization(name="Acme Corp", website="https://acme.example.com")
        org_globex = Organization(name="Globex", website="https://globex.example.com")
        org_initech = Organization(name="Initech", website=None)
        db.add_all([org_acme, org_globex, org_initech])
        db.flush()

        contacts = [
            Contact(
                first_name="Alice",
                last_name="Johnson",
                email="alice@acme.example.com",
                phone="555-0101",
                organization_id=org_acme.id,
            ),
            Contact(
                first_name="Bob",
                last_name="Smith",
                email="bob@globex.example.com",
                phone="555-0102",
                organization_id=org_globex.id,
            ),
            Contact(
                first_name="Carol",
                last_name="Davis",
                email="carol@initech.example.com",
                phone=None,
                organization_id=org_initech.id,
            ),
            Contact(
                first_name="Dan",
                last_name="Lee",
                email="dan.lee@example.com",
                phone="555-0104",
                organization_id=None,
            ),
        ]
        db.add_all(contacts)
        db.flush()

        deals = [
            Deal(
                title="Enterprise license",
                amount=Decimal("120000.00"),
                stage="negotiation",
                organization_id=org_acme.id,
                contact_id=contacts[0].id,
            ),
            Deal(
                title="Support renewal",
                amount=Decimal("24000.50"),
                stage="closed_won",
                organization_id=org_globex.id,
                contact_id=contacts[1].id,
            ),
            Deal(
                title="Pilot project",
                amount=Decimal("5000.00"),
                stage="prospecting",
                organization_id=org_initech.id,
                contact_id=contacts[2].id,
            ),
            Deal(
                title="Inbound lead",
                amount=Decimal("15000.00"),
                stage="qualification",
                organization_id=None,
                contact_id=contacts[3].id,
            ),
        ]
        db.add_all(deals)
        db.commit()
        print("Seed complete: user demo / password; sample orgs, contacts, deals.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
