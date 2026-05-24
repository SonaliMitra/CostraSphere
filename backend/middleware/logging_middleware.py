import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from sqlalchemy.orm import Session

from utilities.database import SessionLocal
from models.models import APILog
from auth.security import decode_token


class APILoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        start = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start) * 1000

        user_id = None
        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer "):
            try:
                payload = decode_token(auth[7:])
                user_id = int(payload.get("sub", 0)) or None
            except Exception:
                pass

        if not request.url.path.startswith("/docs") and request.url.path != "/openapi.json":
            db: Session = SessionLocal()
            try:
                log = APILog(
                    method=request.method,
                    path=str(request.url.path),
                    status_code=response.status_code,
                    user_id=user_id,
                    duration_ms=round(duration_ms, 2),
                )
                db.add(log)
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()

        return response
