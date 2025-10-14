from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

Base = declarative_base()

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), unique=True, nullable=False)
    cron = Column(String(100), nullable=False)
    command = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    paused = Column(Boolean, default=False)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    task_metadata = Column(JSON, nullable=True)

class TaskDependency(Base):
    __tablename__ = "task_dependencies"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"))
    depends_on_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"))

class Execution(Base):
    __tablename__ = "executions"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    scheduled_time = Column(DateTime, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False)  # PENDING, RUNNING, SUCCESS, FAILED, RETRYING
    attempt = Column(Integer, default=0)
    result = Column(Text, nullable=True)
    logs = Column(Text, nullable=True)
