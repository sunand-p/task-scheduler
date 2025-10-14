import asyncio, logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.database import init_db, SessionLocal
from app.models import Task, TaskDependency, Execution
from app.scheduler import scheduler, schedule_all_tasks, add_or_update_job
from app.utils import next_run_times
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskIn(BaseModel):
    name:str; cron:str; command: str|None=None; dependencies: list[int]=[]; max_retries:int=3; active:bool=True

@app.on_event("startup")
async def startup():
    init_db()
    scheduler.start()
    await asyncio.sleep(0.05); schedule_all_tasks()

def detect_cycle(db):
    # build adjacency and run DFS
    rows = db.query(TaskDependency).all()
    adj = {}
    nodes = set()
    for r in rows:
        adj.setdefault(r.task_id, []).append(r.depends_on_id)
        nodes.add(r.task_id); nodes.add(r.depends_on_id)
    visited = {}
    def dfs(u):
        if visited.get(u)==1: return True
        if visited.get(u)==2: return False
        visited[u]=1
        for v in adj.get(u,[]):
            if dfs(v): return True
        visited[u]=2; return False
    for n in nodes:
        if visited.get(n) is None and dfs(n):
            return True
    return False

@app.get("/")
def get_home():    
    return "Task Scheduler API"

@app.post("/task")
def create_task(payload: TaskIn):
    db = SessionLocal()
    try:
        t = Task(name=payload.name, cron=payload.cron, command=payload.command, max_retries=payload.max_retries, active=payload.active)
        db.add(t); db.flush()
        for dep_id in payload.dependencies:
            if dep_id == t.id:
                raise HTTPException(400,"Self-dependency")
            rel = TaskDependency(task_id=t.id, depends_on_id=dep_id)
            db.add(rel)
        db.flush()
        if detect_cycle(db):
            db.rollback()
            raise HTTPException(400,"Dependency cycle detected")
        db.commit(); db.refresh(t)
        add_or_update_job(t)
        return {"id":t.id}
    finally:
        db.close()

@app.get("/tasks")
def list_tasks():
    db = SessionLocal()
    try:
        out=[]
        for t in db.query(Task).all():
            try:
                nr=[dt.isoformat() for dt in next_run_times(t.cron,5)]
            except Exception:
                nr=[]
            out.append({"id":t.id,"name":t.name,"cron":t.cron,"active":t.active,"paused":t.paused,"next_runs":nr})
        return out
    finally:
        db.close()

@app.get("/task/{task_id}")
def get_task(task_id: int):
    db = SessionLocal()
    try:
        t = db.query(Task).filter(Task.id == task_id).first()
        if not t:
            raise HTTPException(404, "Task not found")

        # Fetch dependencies
        deps = db.query(TaskDependency.depends_on_id).filter(TaskDependency.task_id == t.id).all()
        dep_ids = [d.depends_on_id for d in deps]

        return {
            "id": t.id,
            "name": t.name,
            "cron": t.cron,
            "command": t.command,
            "max_retries": t.max_retries,
            "active": t.active,
            "dependencies": dep_ids
        }
    finally:
        db.close()

@app.put("/task/{task_id}")
def update_task(task_id: int, payload: TaskIn):
    db = SessionLocal()
    try:
        t = db.query(Task).filter(Task.id == task_id).first()
        if not t:
            raise HTTPException(404, "Task not found")

        # Update fields
        t.name = payload.name
        t.cron = payload.cron
        t.command = payload.command
        t.max_retries = payload.max_retries
        t.active = payload.active

        # Clear old dependencies
        db.query(TaskDependency).filter(TaskDependency.task_id == t.id).delete()

        # Add new dependencies
        for dep_id in payload.dependencies:
            if dep_id == t.id:
                raise HTTPException(400, "Self-dependency")
            rel = TaskDependency(task_id=t.id, depends_on_id=dep_id)
            db.add(rel)

        db.flush()
        if detect_cycle(db):
            db.rollback()
            raise HTTPException(400, "Dependency cycle detected")

        db.commit()
        db.refresh(t)
        add_or_update_job(t)

        return {"message": "Task updated", "id": t.id}
    finally:
        db.close()

@app.post("/task/{task_id}/pause")
def pause(task_id:int):
    db=SessionLocal()
    try:
        t=db.query(Task).get(task_id)
        if not t: raise HTTPException(404,"not found")
        t.paused=True; db.commit()
        job=f"task_{task_id}"
        from app.scheduler import scheduler
        if scheduler.get_job(job): scheduler.remove_job(job)
        return {"ok":True}
    finally:
        db.close()

@app.post("/task/{task_id}/resume")
def resume(task_id:int):
    db=SessionLocal()
    try:
        t=db.query(Task).get(task_id)
        if not t: raise HTTPException(404,"not found")
        t.paused=False; db.commit()
        add_or_update_job(t)
        return {"ok":True}
    finally:
        db.close()

@app.post("/task/{task_id}/trigger")
async def trigger(task_id:int):
    db=SessionLocal()
    try:
        t=db.query(Task).get(task_id)
        if not t: raise HTTPException(404,"not found")
        e = Execution(task_id=t.id, scheduled_time=datetime.now(timezone.utc), status="PENDING", attempt=0)
        db.add(e); db.commit(); db.refresh(e)
        from app.worker import enqueue_execution
        await enqueue_execution(e.id)
        return {"execution_id": e.id}
    finally:
        db.close()

@app.get("/executions")
def executions(task_id:int|None=None, status:str|None=None, limit:int=50):
    db=SessionLocal()
    try:
        q=db.query(Execution)
        if task_id: q=q.filter(Execution.task_id==task_id)
        if status: q=q.filter(Execution.status==status)
        rows=q.order_by(Execution.scheduled_time.desc()).limit(limit).all()
        return [{"id":r.id,"task_id":r.task_id,"status":r.status,"attempt":r.attempt,"start":r.start_time.isoformat() if r.start_time else None,"end":r.end_time.isoformat() if r.end_time else None,"logs":r.logs} for r in rows]
    finally:
        db.close()

@app.get("/stats")
def stats():
    db=SessionLocal()
    try:
        total=db.query(Task).count()
        executions=db.query(Execution).count()
        success=db.query(Execution).filter(Execution.status=="SUCCESS").count()
        success_rate=(success/executions*100) if executions else None
        upcoming=[]
        for t in db.query(Task).filter(Task.active==True, Task.paused==False).all():
            try: nr=next_run_times(t.cron,1)[0].isoformat()
            except: nr=None
            upcoming.append({"task_id":t.id,"name":t.name,"next_run":nr})
        return {"total_tasks":total,"total_executions":executions,"success_rate":success_rate,"upcoming":upcoming}
    finally:
        db.close()
