import redis
import json
import os
import time
import threading
import fnmatch
from functools import wraps
from logger import logger
from firestore_cache import firestore_get, firestore_set, firestore_delete as fs_delete, firestore_delete_collection, is_firestore_available

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

if REDIS_URL and not REDIS_URL.startswith(("redis://", "rediss://", "unix://")):
    REDIS_URL = "redis://" + REDIS_URL

redis_client = None

def _connect_redis():
    global redis_client
    for attempt in range(3):
        try:
            client = redis.from_url(REDIS_URL, decode_responses=True)
            client.ping()
            redis_client = client
            logger.info("Redis connected at %s (attempt %d)", REDIS_URL, attempt + 1)
            return
        except Exception as e:
            logger.warning("Redis connection attempt %d failed: %s", attempt + 1, e)
            time.sleep(1 * (2 ** attempt))
    logger.warning("Redis unavailable after 3 retries — running with in-memory + Firestore cache")

_connect_redis()

CACHE_TTL = {
    "blogs_list": 120,
    "blog_detail": 300,
    "profile": 300,
    "ai_generation": 3600,
    "search": 60,
}

_memory_cache = {}
_memory_lock = threading.Lock()

def _mem_set(key, value, ttl):
    with _memory_lock:
        _memory_cache[key] = (value, time.time() + ttl)

def _mem_get(key):
    with _memory_lock:
        entry = _memory_cache.get(key)
        if entry is None:
            return None
        val, expiry = entry
        if time.time() > expiry:
            del _memory_cache[key]
            return None
        return val

def _mem_delete(key):
    with _memory_lock:
        _memory_cache.pop(key, None)

def _mem_clear_pattern(pattern):
    with _memory_lock:
        for key in list(_memory_cache.keys()):
            if fnmatch.fnmatch(key, pattern):
                _memory_cache.pop(key, None)


def _fs_collection(key: str) -> str:
    return key.split(":")[0]


def get_cache(key: str):
    val = _mem_get(key)
    if val is not None:
        return val
    if redis_client:
        try:
            data = redis_client.get(key)
            if data:
                parsed = json.loads(data)
                _mem_set(key, parsed, CACHE_TTL.get(_fs_collection(key), 300))
                return parsed
        except Exception as e:
            logger.error("Redis GET error: %s", e)
            _connect_redis()
    if is_firestore_available():
        collection = _fs_collection(key)
        doc = firestore_get(collection, key)
        if doc:
            age = time.time() - doc.get("_cached_at", 0)
            ttl = doc.get("_ttl", 300)
            if age < ttl:
                payload = {k: v for k, v in doc.items() if not k.startswith("_")}
                _mem_set(key, payload, int(ttl - age))
                return payload
    return None


def set_cache(key: str, value, ttl: int | None = None):
    expire = ttl or CACHE_TTL.get(_fs_collection(key), 300)
    _mem_set(key, value, expire)
    if redis_client:
        try:
            redis_client.set(key, json.dumps(value), ex=expire)
        except Exception as e:
            logger.error("Redis SET error: %s", e)
            _connect_redis()
    if is_firestore_available():
        collection = _fs_collection(key)
        try:
            firestore_set(collection, key, value, expire)
        except Exception as e:
            logger.error("Firestore SET error: %s", e)


def delete_cache(key: str):
    _mem_delete(key)
    if redis_client:
        try:
            redis_client.delete(key)
        except Exception as e:
            logger.error("Redis DEL error: %s", e)
    if is_firestore_available():
        collection = _fs_collection(key)
        try:
            fs_delete(collection, key)
        except Exception as e:
            logger.error("Firestore DEL error: %s", e)


def invalidate_pattern(pattern: str):
    _mem_clear_pattern(pattern)
    if redis_client:
        try:
            for key in redis_client.scan_iter(match=pattern):
                redis_client.delete(key)
        except Exception as e:
            logger.error("Redis pattern invalidation error: %s", e)
    if is_firestore_available():
        collection = pattern.split(":")[0]
        try:
            docs = __import__("firebase_admin").firestore.client().collection(collection).list_documents()
            for doc in docs:
                if fnmatch.fnmatch(doc.id, pattern):
                    doc.delete()
        except Exception as e:
            logger.error("Firestore pattern invalidation error: %s", e)


def get_cache_with_ttl(key: str, resource_type: str = "ai_generation"):
    ttl = CACHE_TTL.get(resource_type, 300)
    return get_cache(key), ttl


def cached(resource_type: str, key_builder=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = key_builder(*args, **kwargs) if key_builder else f"{resource_type}:{hash(args)}:{hash(frozenset(kwargs.items()))}"
            ttl = CACHE_TTL.get(resource_type, 300)
            cached_val = get_cache(key)
            if cached_val is not None:
                return cached_val
            result = func(*args, **kwargs)
            set_cache(key, result, ttl)
            return result
        return wrapper
    return decorator


def invalidate_resource(resource_type: str, suffix: str = "*"):
    invalidate_pattern(f"{resource_type}:{suffix}")
