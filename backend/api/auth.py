from __future__ import annotations

import base64
import hashlib
import hmac
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional

import jwt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from database.firebase import get_firestore

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkeyedusense")
ALGORITHM = "HS256"
PBKDF2_ITERATIONS = 210_000
DEFAULT_STUDENT_DATA_ID = os.getenv("DEFAULT_STUDENT_DATA_ID", "STU000001")


class LoginSchema(BaseModel):
    email: str
    password: str


class SignupSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"


DEMO_ACCOUNTS = {
    "admin@edusense.com": {
        "password": "admin123",
        "user": {
            "id": "demo-admin-1",
            "email": "admin@edusense.com",
            "name": "Demo Admin",
            "role": "admin",
        },
    },
    "faculty@edusense.com": {
        "password": "faculty123",
        "user": {
            "id": "demo-faculty-1",
            "email": "faculty@edusense.com",
            "name": "Demo Faculty",
            "role": "faculty",
            "faculty_id": "FAC_DEMO_001",
        },
    },
    "student@edusense.com": {
        "password": "student123",
        "user": {
            "id": "demo-student-1",
            "email": "student@edusense.com",
            "name": "Demo Student",
            "role": "student",
            "student_id": DEFAULT_STUDENT_DATA_ID,
        },
    },
}


def _b64_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64_decode(value: str) -> bytes:
    pad = "=" * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode(value + pad)


def _hash_pbkdf2(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${_b64_encode(salt)}${_b64_encode(digest)}"


def _verify_pbkdf2(password: str, hashed_password: str) -> bool:
    try:
        scheme, iter_str, salt_b64, hash_b64 = hashed_password.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False

        iterations = int(iter_str)
        salt = _b64_decode(salt_b64)
        expected = _b64_decode(hash_b64)

        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            iterations,
        )
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False

    if hashed_password.startswith("pbkdf2_sha256$"):
        return _verify_pbkdf2(plain_password, hashed_password)

    # Legacy fallback for previously stored bcrypt hashes.
    try:
        from passlib.context import CryptContext

        legacy = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return legacy.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return _hash_pbkdf2(password)


def create_access_token(data: dict):
    payload = data.copy()
    payload.update({"exp": datetime.utcnow() + timedelta(minutes=1440)})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _demo_login(email: str, password: str) -> Optional[Dict]:
    account = DEMO_ACCOUNTS.get(email.lower().strip())
    if not account:
        return None

    if password != account["password"]:
        return None

    user = account["user"]
    token = create_access_token({"sub": user["email"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


# Demo accounts for testing (no database needed)
DEMO_ACCOUNTS = {
    "admin@edusense.com": {"password": "admin123", "role": "admin", "name": "Admin User", "id": "ADMIN_001"},
    "faculty@edusense.com": {"password": "faculty123", "role": "faculty", "name": "Dr. Faculty", "id": "FAC_001", "faculty_id": "FAC_001", "department": "Computer Engineering"},
    # Student accounts with student_id as both username and password
    "23aiml001": {"password": "23aiml001", "role": "student", "name": "Ishita Soni", "id": "23AIML001", "student_id": "23AIML001", "department": "Artificial Intelligence and Machine Learning", "semester": 7},
    "23ce001": {"password": "23ce001", "role": "student", "name": "Meet Desai", "id": "23CE001", "student_id": "23CE001", "department": "Computer Engineering", "semester": 8},
    "25ec001": {"password": "25ec001", "role": "student", "name": "Manav Sharma", "id": "25EC001", "student_id": "25EC001", "department": "Electronics and Communication Engineering", "semester": 4},
    "23it002": {"password": "23it002", "role": "student", "name": "Mahi Reddy", "id": "23IT002", "student_id": "23IT002", "department": "Information Technology", "semester": 8},
    "25me003": {"password": "25me003", "role": "student", "name": "Vaishnavi Reddy", "id": "25ME003", "student_id": "25ME003", "department": "Mechanical Engineering", "semester": 4},
}

@router.post("/login")
def login(creds: LoginSchema):
    db = get_firestore()
    users = db.collection("users").where("email", "==", creds.email).limit(1).stream()
    user_doc = next(users, None)

    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = user_doc.to_dict()
    if not verify_password(creds.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.get("email"), "role": user.get("role")})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_doc.id,
            "email": user.get("email"),
            "name": user.get("name"),
            "role": user.get("role"),
            "student_id": user.get("student_id"),
            "faculty_id": user.get("faculty_id"),
        },
    }


@router.post("/signup")
def signup(data: SignupSchema):
    if data.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can sign up. Faculty accounts are generated by admins.",
        )

    if data.email.lower().strip() in DEMO_ACCOUNTS:
        raise HTTPException(
            status_code=400,
            detail="This email is reserved for demo login. Use another email for signup.",
        )

    try:
        db = get_firestore()
        existing = db.collection("users").where("email", "==", data.email).limit(1).stream()
        if next(existing, None):
            raise HTTPException(status_code=400, detail="Email already registered")

        user_id = str(uuid.uuid4())
        db.collection("users").document(user_id).set(
            {
                "email": data.email,
                "password": get_password_hash(data.password),
                "name": data.name,
                "role": "student",
                # Map to available dataset id so dashboard works immediately for new signups.
                "student_id": DEFAULT_STUDENT_DATA_ID,
                "created_at": datetime.utcnow().isoformat(),
            }
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Signup service unavailable: {exc}") from exc

    return {"message": "User registered successfully"}