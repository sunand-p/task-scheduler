import logging, asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.database import SessionLocal
from app.models import Task
from app.utils import next_run_times
from app.worker import enqueue_execution

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

def add_or_update_job(task):
    job_id = f"task_{task.id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
    try:
        trigger = CronTrigger.from_crontab(task.cron)
    except Exception:
        # fallback to schedule next-run manually via croniter
        trigger = CronTrigger.from_crontab(task.cron)  # let it raise to surface bad cron
    scheduler.add_job(func=on_scheduled_fire, trigger=trigger, args=[task.id], id=job_id, replace_existing=True)
    logger.info("Scheduled %s at %s", job_id, task.cron)

async def on_scheduled_fire(task_id: int):
    db = SessionLocal()
    try:
        t = db.query(Task).get(task_id)
        if not t or not t.active or t.paused:
            return
        from app.models import Execution
        e = Execution(task_id=task_id, scheduled_time=__import__('datetime').datetime.utcnow(), status="PENDING", attempt=0)
        db.add(e); db.commit(); db.refresh(e)
        await enqueue_execution(e.id)
    finally:
        db.close()

def schedule_all_tasks():
    db = SessionLocal()
    try:
        tasks = db.query(Task).filter(Task.active==True, Task.paused==False).all()
        for t in tasks:
            add_or_update_job(t)
    finally:
        db.close()
