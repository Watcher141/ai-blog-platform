import redis
import json
import os

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def get_cache(key: str):
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print("Redis GET error:", e)
    return None

def set_cache(key: str, value):
    try:
        redis_client.set(key, json.dumps(value), ex=3600)
    except Exception as e:
        print("Redis SET error:", e)