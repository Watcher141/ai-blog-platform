import os
import json
from logger import logger

_fcm_available = False

FIREBASE_SERVICE_ACCOUNT_PATH = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")
FIREBASE_SERVICE_ACCOUNT_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")

if FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON:
    try:
        import firebase_admin
        from firebase_admin import credentials, messaging
        try:
            _firebase_app = firebase_admin.get_app()
        except ValueError:
            if FIREBASE_SERVICE_ACCOUNT_PATH and os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
                cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
            else:
                cred_dict = json.loads(FIREBASE_SERVICE_ACCOUNT_JSON)
                cred = credentials.Certificate(cred_dict)
            try:
                _firebase_app = firebase_admin.initialize_app(cred)
            except ValueError:
                _firebase_app = firebase_admin.get_app()
        _fcm_available = True
        logger.info("FCM initialized")
    except Exception as e:
        logger.warning("FCM init failed: %s", e)
else:
    logger.info("No Firebase credentials — FCM push disabled")


def send_push_notification(device_token: str, title: str, body: str, data: dict | None = None):
    if not _fcm_available:
        logger.info("[FCM fallback] Would push: title=%s body=%s", title, body)
        return {"success": False, "fallback": True}
    try:
        from firebase_admin import messaging
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=device_token,
        )
        response = messaging.send(message)
        logger.info("FCM push sent: %s", response)
        return {"success": True, "message_id": response}
    except Exception as e:
        logger.error("FCM push error: %s", e)
        return {"success": False, "error": str(e)}


def send_push_to_multiple(device_tokens: list[str], title: str, body: str, data: dict | None = None):
    if not _fcm_available:
        logger.info("[FCM fallback] Would push to %d devices: title=%s", len(device_tokens), title)
        return {"success": False, "fallback": True}
    if not device_tokens:
        return {"success": True, "count": 0}
    try:
        from firebase_admin import messaging
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            tokens=device_tokens,
        )
        response = messaging.send_each_for_multicast(message)
        logger.info("FCM multicast: %d success, %d failure", response.success_count, response.failure_count)
        return {"success": True, "success_count": response.success_count, "failure_count": response.failure_count}
    except Exception as e:
        logger.error("FCM multicast error: %s", e)
        return {"success": False, "error": str(e)}


def is_fcm_available():
    return _fcm_available
