"""Local-only community preview. Never uses the configured MongoDB or sends e-mail.
Run: python preview_community.py
Install requirements_community_test.txt first. Data resets when this process stops.
"""
import os
import secrets

os.environ["MONGO_URL"] = ""
os.environ["JWT_SECRET"] = secrets.token_urlsafe(48)
os.environ["COOKIE_SECURE"] = "false"
os.environ["VERCEL"] = "0"
os.environ["CORS_ORIGINS"] = "http://127.0.0.1:4178,http://localhost:4178"

from mongomock_motor import AsyncMongoMockClient
import server
from community import initialize_community

server.db = AsyncMongoMockClient()["community_local_preview"]
server.app.router.on_startup.clear()
server.app.router.on_shutdown.clear()

async def no_email(*args, **kwargs):
    pass
server.maybe_send_welcome_email = no_email

@server.app.on_event("startup")
async def setup_preview():
    await initialize_community(server.db)
    await server.db.users.insert_one({
        "user_id": "preview_admin", "email": "equipe@example.com", "name": "Equipe de prévia",
        "password_hash": server.hash_password("Comunidade-local-2026!"), "role": "admin",
        "phone": "", "picture": "", "created_at": server.now_iso(),
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(server.app, host="127.0.0.1", port=8011, log_level="warning")
