from croniter import croniter
from datetime import datetime, timezone
from typing import List

def next_run_times(cron_expr: str, count: int = 5, base: datetime | None = None) -> List[datetime]:
    base = base or datetime.now(timezone.utc)
    it = croniter(cron_expr, base)
    return [it.get_next(datetime) for _ in range(count)]
