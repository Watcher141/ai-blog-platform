from sqlalchemy import Column, Integer, String, Text, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from database import Base


class Blog(Base):
    __tablename__ = "blogs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    title = Column(String)
    content = Column(Text)
    tags = Column(String)
    summary = Column(Text, nullable=True)
    status = Column(String, default="published")
    cover_image = Column(String, nullable=True)  # ✅ new
    created_at = Column(DateTime, default=func.now())


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    display_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())


class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, index=True)
    user_id = Column(String, index=True)
    created_at = Column(DateTime, default=func.now())
    __table_args__ = (UniqueConstraint("blog_id", "user_id", name="unique_like"),)


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, index=True)
    user_id = Column(String, index=True)
    content = Column(Text)
    created_at = Column(DateTime, default=func.now())


class Follow(Base):
    __tablename__ = "follows"
    id = Column(Integer, primary_key=True, index=True)
    follower_uid = Column(String, index=True)
    following_uid = Column(String, index=True)
    created_at = Column(DateTime, default=func.now())
    __table_args__ = (UniqueConstraint("follower_uid", "following_uid", name="unique_follow"),)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    type = Column(String)
    message = Column(String)
    link = Column(String, nullable=True)
    is_read = Column(String, default="false")
    created_at = Column(DateTime, default=func.now())