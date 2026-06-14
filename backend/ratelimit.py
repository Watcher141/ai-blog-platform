import time
import threading
from collections import defaultdict

class RateLimiter:
    def __init__(self):
        self._buckets = defaultdict(list)
        self._lock = threading.Lock()
        self._cleanup_interval = 300
        self._last_cleanup = time.time()

    def _cleanup(self):
        now = time.time()
        if now - self._last_cleanup < self._cleanup_interval:
            return
        cutoff = now - 3600
        with self._lock:
            for key in list(self._buckets.keys()):
                self._buckets[key] = [t for t in self._buckets[key] if t > cutoff]
                if not self._buckets[key]:
                    del self._buckets[key]
        self._last_cleanup = now

    def check(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        self._cleanup()
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = self._buckets[key]
            timestamps[:] = [t for t in timestamps if t > cutoff]
            if len(timestamps) >= max_requests:
                return False
            timestamps.append(now)
            return True

    def get_remaining(self, key: str, max_requests: int, window_seconds: int = 60) -> int:
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = [t for t in self._buckets.get(key, []) if t > cutoff]
            return max(0, max_requests - len(timestamps))

rate_limiter = RateLimiter()
