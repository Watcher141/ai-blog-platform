import json
import os

import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

if not firebase_admin._apps:
    # Load from env variable on production, file on local
    firebase_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    
    if firebase_json:
        # Production — load from environment variable
        cred_dict = json.loads(firebase_json)
        cred = credentials.Certificate(cred_dict)
    else:
        # Local development — load from file
        cred = credentials.Certificate("firebase_service_account.json")
    
    firebase_admin.initialize_app(cred)

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(
            token,
            clock_skew_seconds=60  # ✅ allow 60 seconds of clock skew
        )
        uid = decoded_token["uid"]
        return uid
    except Exception as e:
        print("TOKEN VERIFY ERROR:", e)
        raise HTTPException(
            status_code=401,
            detail="Invalid Firebase token"
        )