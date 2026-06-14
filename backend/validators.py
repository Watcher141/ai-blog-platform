import re


USERNAME_MIN = 3
USERNAME_MAX = 30
PASSWORD_MIN = 8
TITLE_MAX = 200
CONTENT_MAX = 50000
BIO_MAX = 500
TAG_MAX = 100


def validate_email(email: str) -> str | None:
    if not email or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email.strip()):
        return "Invalid email format"
    return None


def validate_password(password: str) -> str | None:
    if not password or len(password) < PASSWORD_MIN:
        return f"Password must be at least {PASSWORD_MIN} characters"
    if not re.search(r'[A-Za-z]', password):
        return "Password must contain at least one letter"
    if not re.search(r'[0-9]', password):
        return "Password must contain at least one digit"
    return None


def validate_username(username: str) -> str | None:
    if not username or len(username) < USERNAME_MIN or len(username) > USERNAME_MAX:
        return f"Username must be {USERNAME_MIN}-{USERNAME_MAX} characters"
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return "Username can only contain letters, numbers, and underscores"
    return None


def validate_title(title: str) -> str | None:
    if not title or not title.strip():
        return "Title is required"
    if len(title.strip()) > TITLE_MAX:
        return f"Title must be at most {TITLE_MAX} characters"
    return None


def validate_content(content: str) -> str | None:
    if not content or not content.strip():
        return "Content is required"
    if len(content) > CONTENT_MAX:
        return f"Content must be at most {CONTENT_MAX} characters"
    return None


def validate_bio(bio: str | None) -> str | None:
    if bio and len(bio) > BIO_MAX:
        return f"Bio must be at most {BIO_MAX} characters"
    return None


def validate_tags(tags: list[str]) -> str | None:
    if not tags:
        return None
    if len(tags) > 10:
        return "At most 10 tags allowed"
    for tag in tags:
        if len(tag) > TAG_MAX:
            return f"Each tag must be at most {TAG_MAX} characters"
    return None


ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024


def validate_upload(content_type: str, file_size: int, filename: str) -> str | None:
    if content_type not in ALLOWED_IMAGE_TYPES:
        return "Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)"
    if file_size > MAX_UPLOAD_SIZE:
        return "File size must be under 5MB"
    if not filename or ".." in filename or "/" in filename or "\\" in filename:
        return "Invalid filename"
    return None
