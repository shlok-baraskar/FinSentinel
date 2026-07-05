"""
Secure script to create an Admin account.
Run this manually from terminal: python create_admin.py
This is NEVER exposed via the public API or website.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, create_tables
from app.core.security import hash_password
from app.models.user import User

def create_admin():
    create_tables()
    db = SessionLocal()

    print("=" * 50)
    print("   FinSentinel — Create Admin Account")
    print("=" * 50)

    full_name = input("\nFull name: ").strip()
    email     = input("Email: ").strip()
    password  = input("Password (min 6 chars): ").strip()

    if len(password) < 6:
        print("\n❌ Password must be at least 6 characters")
        db.close()
        return

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"\n❌ A user with email '{email}' already exists")
        db.close()
        return

    admin = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role="super_admin"
    )
    db.add(admin)
    db.commit()

    print(f"\n✅ Admin account created successfully!")
    print(f"   Name : {full_name}")
    print(f"   Email: {email}")
    print(f"   Role : admin")
    print("\nYou can now log in with these credentials on the website.")
    print("=" * 50)

    db.close()

if __name__ == "__main__":
    create_admin()