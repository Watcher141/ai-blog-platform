import os
import json
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth import decode_access_token, get_user_by_id

security = HTTPBearer(auto_error=False)

_firebase_app = None
_firebase_available = False

FIREBASE_SERVICE_ACCOUNT_PATH = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")
FIREBASE_SERVICE_ACCOUNT_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")

if FIREBASE_SERVICE_ACCOUNT_PATH and os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
    try:
        cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
        _firebase_app = firebase_admin.initialize_app(cred)
        _firebase_available = True
        print("[Firebase] Admin SDK initialized via file")
    except Exception as e:
        print(f"[Firebase] Failed to init from file: {e}")
elif FIREBASE_SERVICE_ACCOUNT_JSON:
    try:
        cred_dict = json.loads(FIREBASE_SERVICE_ACCOUNT_JSON)
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        _firebase_available = True
        print("[Firebase] Admin SDK initialized via env var")
    except Exception as e:
        print(f"[Firebase] Failed to init from env var: {e}")
else:
    print("[Firebase] No credentials found — running without Firebase. "
          "Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON to enable.")


def verify_firebase_token(id_token: str) -> str | None:
    if not _firebase_available:
        return None
    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return decoded.get("uid")
    except Exception as e:
        print(f"[Firebase] Token verification failed: {e}")
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authorization header required")

    token = credentials.credentials

    firebase_uid = verify_firebase_token(token)
    if firebase_uid:
        return firebase_uid

    jwt_user_id = decode_access_token(token)
    if jwt_user_id:
        return jwt_user_id

    raise HTTPException(status_code=401, detail="Invalid or expired token")
