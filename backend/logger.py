import logging
import sys
import uuid
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    return request_id_var.get()


def set_request_id(rid: str | None = None) -> str:
    rid = rid or uuid.uuid4().hex[:12]
    request_id_var.set(rid)
    return rid


class RequestIDFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "-"
        return True


def setup_logger(name: str = "ai_blog") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    fmt = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(request_id)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(fmt)
    console_handler.addFilter(RequestIDFilter())

    if not logger.handlers:
        logger.addHandler(console_handler)

    try:
        file_handler = logging.FileHandler("app.log", encoding="utf-8")
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(fmt)
        file_handler.addFilter(RequestIDFilter())
        logger.addHandler(file_handler)
    except Exception:
        pass

    return logger


logger = setup_logger()
