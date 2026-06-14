import os
import json
from logger import logger

_firestore = None
_firestore_available = False

FIREBASE_SERVICE_ACCOUNT_PATH = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")
FIREBASE_SERVICE_ACCOUNT_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")

if FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        if FIREBASE_SERVICE_ACCOUNT_PATH and os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
        elif FIREBASE_SERVICE_ACCOUNT_JSON:
            cred_dict = json.loads(FIREBASE_SERVICE_ACCOUNT_JSON)
            cred = credentials.Certificate(cred_dict)
        else:
            raise RuntimeError("No valid Firebase credentials found")
        try:
            _firebase_app = firebase_admin.get_app()
        except ValueError:
            _firebase_app = firebase_admin.initialize_app(cred)
        _firestore = firestore.client()
        _firestore_available = True
        logger.info("Firestore client initialized")
    except Exception as e:
        logger.warning("Firestore init failed: %s — running without Firestore cache", e)
else:
    logger.info("No Firebase credentials — Firestore cache disabled")


def firestore_get(collection: str, doc_id: str):
    if not _firestore_available:
        return None
    try:
        doc = _firestore.collection(collection).document(doc_id).get()
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        logger.error("Firestore GET error: %s", e)
        return None


def firestore_set(collection: str, doc_id: str, data: dict, ttl_seconds: int = 300):
    if not _firestore_available:
        return
    try:
        import time
        data["_cached_at"] = time.time()
        data["_ttl"] = ttl_seconds
        _firestore.collection(collection).document(doc_id).set(data)
    except Exception as e:
        logger.error("Firestore SET error: %s", e)


def firestore_delete(collection: str, doc_id: str):
    if not _firestore_available:
        return
    try:
        _firestore.collection(collection).document(doc_id).delete()
    except Exception as e:
        logger.error("Firestore DELETE error: %s", e)


def firestore_delete_collection(collection: str):
    if not _firestore_available:
        return
    try:
        docs = _firestore.collection(collection).list_documents()
        for doc in docs:
            doc.delete()
    except Exception as e:
        logger.error("Firestore collection delete error: %s", e)


def is_firestore_available():
    return _firestore_available
