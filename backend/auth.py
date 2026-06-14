import uuid
import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from database import SessionLocal
from models import User

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is required. "
        "Set it to a long random string (e.g. openssl rand -hex 32)."
    )
ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", "72"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "jti": str(uuid.uuid4()),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def create_user(email: str, password: str, display_name: str | None = None) -> User:
    from validators import validate_email, validate_password
    from fastapi import HTTPException
    email_err = validate_email(email)
    if email_err:
        raise HTTPException(status_code=400, detail=email_err)
    pw_err = validate_password(password)
    if pw_err:
        raise HTTPException(status_code=400, detail=pw_err)
    db = SessionLocal()
    try:
        user = User(
            id=str(uuid.uuid4()),
            email=email.strip().lower(),
            password_hash=hash_password(password),
            display_name=display_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def get_user_by_email(email: str) -> User | None:
    db = SessionLocal()
    try:
        return db.query(User).filter(User.email == email).first()
    finally:
        db.close()


def get_user_by_id(user_id: str) -> User | None:
    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == user_id).first()
    finally:
        db.close()
