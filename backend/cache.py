import redis
import json
import os

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

# ✅ Fix missing scheme
if REDIS_URL and not REDIS_URL.startswith(("redis://", "rediss://", "unix://")):
    REDIS_URL = "redis://" + REDIS_URL

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    print("✅ Redis connected!")
except Exception as e:
    print(f"⚠️ Redis connection failed: {e}")
    redis_client = None


def get_cache(key: str):
    if not redis_client:
        return None
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print("Redis GET error:", e)
    return None


def set_cache(key: str, value):
    if not redis_client:
        return
    try:
        redis_client.set(key, json.dumps(value), ex=3600)
    except Exception as e:
        print("Redis SET error:", e)