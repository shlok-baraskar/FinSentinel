from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas import UserResponse, UserSignup
from app.core.security import hash_password

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all users — Admin only."""
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Promote/demote a user's role — Admin only. Super Admin is protected."""
    if new_role not in ("admin", "analyst"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'analyst'")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin role cannot be changed through the dashboard")

    if user.id == admin.id and new_role == "analyst":
        raise HTTPException(status_code=400, detail="You cannot demote yourself")

    user.role = new_role
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Activate/deactivate a user account — Admin only. Super Admin is protected."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin account cannot be deactivated")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate yourself")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.post("/create-admin", response_model=UserResponse)
def create_admin_user(
    data: UserSignup,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Directly create a new Admin account — Super Admin only.
    Regular Admins cannot create other Admins, only Super Admin can.
    """
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only Super Admin can directly create Admin accounts"
        )

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role="admin"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user