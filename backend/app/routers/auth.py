from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import LoginRequest, UserPublic
from app.security import verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(
    request: Request,
    body: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> UserPublic:
    user = db.scalar(select(User).where(User.username == body.username))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    request.session["user_id"] = user.id
    return UserPublic.model_validate(user)


@router.post("/logout")
def logout(request: Request) -> dict[str, str]:
    request.session.clear()
    return {"status": "ok"}


@router.get("/me", response_model=UserPublic)
def me(request: Request, db: Annotated[Session, Depends(get_db)]) -> UserPublic:
    user_id = request.session.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    user = db.get(User, user_id)
    if user is None:
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return UserPublic.model_validate(user)
