from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Blog(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    title = Column(String)
    content = Column(Text)
    tags = Column(String)
    summary = Column(Text, nullable=True)        # for TLDR feature later
    status = Column(String, default="published") # for drafts feature later
    created_at = Column(DateTime, default=func.now())