import asyncio, httpx
from app.database import SessionLocal
from app.models import Execution, Task, TaskDependency
from datetime import datetime, timezone
BACKOFF_SCHEDULE = [60,120,240]
WORKER_CONCURRENCY = 5
worker_semaphore = asyncio.Semaphore(WORKER_CONCURRENCY)

def can_run_with_dependencies(db, task):
    deps = db.query(TaskDependency).filter(TaskDependency.task_id==task.id).all()
    for d in deps:
        last = db.query(Execution).filter(Execution.task_id==d.depends_on_id).order_by(Execution.scheduled_time.desc()).first()
        if not last or last.status != "SUCCESS":
            return False
    return True

async def enqueue_execution(execution_id:int):
    asyncio.create_task(run_execution(execution_id))

async def run_execution(execution_id:int):
    async with worker_semaphore:
        db = SessionLocal()
        try:
            execution = db.query(Execution).get(execution_id)
            if not execution: return
            task = db.query(Task).get(execution.task_id)
            if not task: return
            if not can_run_with_dependencies(db, task):
                execution.status="FAILED"; execution.logs="Dependency unmet"; execution.end_time=datetime.now(timezone.utc); db.commit(); return
            execution.status="RUNNING"; execution.start_time=datetime.now(timezone.utc); db.commit()
            attempt=0; success=False
            while attempt <= task.max_retries and not success:
                try:
                    attempt += 1
                    execution.attempt=attempt; db.commit()
                    if task.command and task.command.startswith("http"):
                        async with httpx.AsyncClient(timeout=30.0) as client:
                            r = await client.post(task.command, json={"task_id":task.id})
                            r.raise_for_status()
                            execution.result = f"HTTP {r.status_code}"
                    else:
                        await asyncio.sleep(0.5); execution.result="local-ok"
                    success=True; execution.status="SUCCESS"; execution.end_time=datetime.now(timezone.utc); execution.logs=(execution.logs or "")+f"\nAttempt {attempt} OK"; db.commit()
                except Exception as e:
                    execution.logs=(execution.logs or "")+f"\nAttempt {attempt}: {repr(e)}"
                    execution.status = "RETRYING" if attempt <= task.max_retries else "FAILED"
                    db.commit()
                    if attempt <= task.max_retries:
                        await asyncio.sleep(BACKOFF_SCHEDULE[min(attempt-1,len(BACKOFF_SCHEDULE)-1)])
            if not success:
                execution.end_time=datetime.now(timezone.utc); db.commit()
        finally:
            db.close()
