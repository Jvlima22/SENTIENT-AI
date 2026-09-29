"""Comunidade jotadev.ai. A vitrine é pública (canais, lista de materiais, encontros); a página do material,
arquivos, publicar e reagir exigem conta. Coleções e permissões são independentes do hub de operação."""
import json
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Literal
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def now():
    return datetime.now(timezone.utc).isoformat()


def ago(**delta):
    return (datetime.now(timezone.utc) - timedelta(**delta)).isoformat()


class TextModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


def https_url(value):
    parts = urlsplit(value) if value else None
    if value and (parts.scheme != "https" or not parts.hostname or parts.username):
        raise ValueError("Use um link HTTPS válido.")
    return value


# Canais abertos a todo membro. Anúncios só a equipe publica.
CHANNELS = ("anuncios", "apresente-se", "chat")
REACTIONS = ("fogo", "palmas", "ideia", "coracao")


class TroubleshootingItem(TextModel):
    problem: str = Field(min_length=3, max_length=300)
    fix: str = Field(min_length=3, max_length=2000)


class ResourceInput(TextModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=80)
    # Palavra que a pessoa comenta no post (ex.: CNPJ). Vira o link curto /c/cnpj.
    keyword: str = Field(default="", pattern=r"^[A-Za-z0-9]{0,30}$")
    video_url: str = Field(default="", max_length=2000)
    # Versão 9:16 (Reels) exibida no celular; a video_url (16:9) fica para telas largas.
    video_vertical_url: str = Field(default="", max_length=2000)
    outcomes: list[str] = Field(default_factory=list, max_length=6)
    troubleshooting: list[TroubleshootingItem] = Field(default_factory=list, max_length=12)
    title: str = Field(min_length=3, max_length=120)
    summary: str = Field(min_length=10, max_length=400)
    category: Literal["Prospecção", "Atendimento", "CRM", "Fundamentos"] = "Fundamentos"
    kind: Literal["Fluxo", "Guia", "Template", "Skill"] = "Fluxo"
    level: Literal["Iniciante", "Intermediário", "Avançado"] = "Iniciante"
    status: Literal["ready", "soon"] = "soon"
    published: bool = True
    version: str = Field(default="1.0", min_length=1, max_length=30)
    requirements: str = Field(default="", max_length=3000)
    costs: str = Field(default="", max_length=2000)
    steps: list[str] = Field(default_factory=list, max_length=20)
    body: str = Field(default="", max_length=30000)
    workflow: dict | None = None
    reviewed: bool = False

    @field_validator("steps")
    @classmethod
    def steps_not_empty(cls, steps):
        if any(not s.strip() or len(s) > 3000 for s in steps):
            raise ValueError("Cada passo precisa de texto, com até 3.000 caracteres.")
        return [s.strip() for s in steps]

    @field_validator("outcomes")
    @classmethod
    def outcomes_short(cls, outcomes):
        if any(not o.strip() or len(o) > 120 for o in outcomes):
            raise ValueError("Cada resultado precisa de texto, com até 120 caracteres.")
        return [o.strip() for o in outcomes]

    @field_validator("keyword")
    @classmethod
    def keyword_upper(cls, value):
        return value.upper()

    @field_validator("video_url", "video_vertical_url")
    @classmethod
    def video_https(cls, value):
        # Aceita arquivos do próprio site (/motion/...) ou links HTTPS externos.
        if re.fullmatch(r"/[A-Za-z0-9._/-]+\.(?:mp4|webm)", value) and ".." not in value:
            return value
        return https_url(value)

    @model_validator(mode="after")
    def validate_download(self):
        if self.workflow is not None:
            raw = json.dumps(self.workflow, ensure_ascii=False)
            if len(raw.encode()) > 1_000_000:
                raise ValueError("O fluxo deve ter no máximo 1 MB.")
            nodes = self.workflow.get("nodes")
            if not isinstance(nodes, list) or not nodes or not isinstance(self.workflow.get("connections"), dict):
                raise ValueError("Envie um export do n8n com nós e conexões.")
            if any(not isinstance(n, dict) or not n.get("name") or not n.get("type") for n in nodes):
                raise ValueError("O fluxo contém nós inválidos.")
            # O n8n exporta a referência da credencial usada em cada nó (id e nome, nunca a chave). Ela só vale
            # na instância de quem exportou, então é removida: quem importa escolhe a própria credencial.
            # pinData (dados de teste gravados no fluxo) pode conter dados de clientes e também sai.
            nodes = [{k: v for k, v in n.items() if k != "credentials"} for n in nodes]
            self.workflow = {**self.workflow, "nodes": nodes}
            self.workflow.pop("pinData", None)
            raw = json.dumps(self.workflow, ensure_ascii=False)
            if re.search(r"sk-(?:ant-)?[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}|https?://[^\s\"]+/(?:webhook|webhook-test)/", raw):
                raise ValueError("Remova tokens e URLs de webhook do arquivo.")
            self.workflow = {k: v for k, v in self.workflow.items() if k in {"name", "nodes", "connections", "settings"}}
            self.workflow["active"] = False
        if self.status == "ready":
            if not self.reviewed:
                raise ValueError("Confirme a revisão do conteúdo antes de liberar o download.")
            if self.kind == "Fluxo" and self.workflow is None:
                raise ValueError("Adicione o JSON do fluxo antes de liberar o download.")
            if self.kind != "Fluxo" and not self.body:
                raise ValueError("Adicione o conteúdo do material.")
        return self


class PostInput(TextModel):
    # Título é opcional: no chat e no Apresente-se a mensagem basta.
    title: str = Field(default="", max_length=160)
    body: str = Field(min_length=2, max_length=8000)
    channel: Literal["anuncios", "apresente-se", "chat"] = "chat"
    resource_slug: str | None = Field(default=None, max_length=80)


class ReplyInput(TextModel):
    body: str = Field(min_length=1, max_length=5000)


class ModerationInput(TextModel):
    pinned: bool = False
    locked: bool = False


class EventInput(TextModel):
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=5, max_length=3000)
    starts_at: datetime
    duration_minutes: int = Field(default=60, ge=15, le=480)
    join_url: str = Field(default="", max_length=2000)
    recording_url: str = Field(default="", max_length=2000)
    published: bool = True

    @field_validator("starts_at")
    @classmethod
    def timezone_required(cls, value):
        if value.tzinfo is None:
            raise ValueError("Informe data e hora com fuso horário.")
        return value.astimezone(timezone.utc)

    @field_validator("join_url", "recording_url")
    @classmethod
    def safe_url(cls, value):
        return https_url(value)


class ActivityInput(TextModel):
    event: Literal["visit", "copy"]
    resource_slug: str | None = Field(default=None, max_length=80)


NOTIFY_CHANNELS = ("onboarding", "apresente-se", "anuncios", "chat", "biblioteca", "vip")
NotifyLevel = Literal["todas", "respostas", "nenhuma"]


class NotificationPrefsInput(TextModel):
    channels: dict[Literal["onboarding", "apresente-se", "anuncios", "chat", "biblioteca", "vip"], NotifyLevel]


class ReportInput(TextModel):
    reason: Literal["spam", "conteudo-improprio", "golpe", "outro"]
    details: str = Field(default="", max_length=2000)
    url: str = Field(default="", max_length=300, pattern=r"^(/[^\s]*)?$")


class JoinInput(TextModel):
    # Origem da entrada: link do Reel (/c/cnpj) grava instagram + palavra-chave.
    source: str = Field(default="direto", pattern=r"^[a-z0-9_-]{1,40}$")
    keyword: str = Field(default="", pattern=r"^[A-Za-z0-9]{0,30}$")
    resource_slug: str | None = Field(default=None, max_length=80)


def make_router(get_db, current_user, admin_user):
    router = APIRouter(prefix="/community-hub", tags=["community"])

    async def optional_user(request: Request):
        try:
            return await current_user(request)
        except HTTPException:
            return None

    def database():
        db = get_db()
        if db is None:
            raise HTTPException(503, "Comunidade indisponível. Tente novamente em instantes.")
        return db

    async def resource(slug, admin=False):
        query = {"slug": slug}
        if not admin:
            query["published"] = True
        item = await database().community_resources.find_one(query, {"_id": 0})
        if not item:
            raise HTTPException(404, "Material não encontrado.")
        return item

    async def activity(user, event, slug=None):
        # Um registro por pessoa, dia, evento e material. Não há rastreamento público.
        key = f"{user['user_id']}:{event}:{slug or ''}:{now()[:10]}"
        await database().community_activity.update_one({"_id": key}, {"$setOnInsert": {
            "user_id": user["user_id"], "event": event, "resource_slug": slug, "created_at": now()
        }}, upsert=True)

    # ---------------------------------------------------------------- entrada
    @router.get("/go/{keyword}")
    async def go(keyword: str):
        # Público de propósito: o link da DM precisa saber para onde levar a pessoa antes do cadastro.
        item = await database().community_resources.find_one({"keyword": keyword.upper(), "published": True}, {"_id": 0, "slug": 1})
        if not item or not keyword:
            raise HTTPException(404, "Link não encontrado.")
        return {"slug": item["slug"]}

    @router.post("/join")
    async def join(data: JoinInput, user=Depends(current_user)):
        """Chamado sempre que o membro abre a comunidade: registra a entrada (uma vez) e a presença."""
        db = database()
        await db.community_presence.update_one({"_id": user["user_id"]}, {"$set": {"last_seen": now()}}, upsert=True)
        existing = await db.community_members.find_one({"_id": user["user_id"]}, {"_id": 0})
        if existing:
            return {"joined_at": existing["joined_at"], "new": False}
        member = {"user_id": user["user_id"], "name": user["name"], "joined_at": now(),
                  "source": data.source, "keyword": data.keyword.upper(), "resource_slug": data.resource_slug}
        result = await db.community_members.update_one({"_id": user["user_id"]}, {"$setOnInsert": member}, upsert=True)
        if result.upserted_id is not None:
            await db.leads.insert_one({
                "id": str(uuid.uuid4()), "name": user["name"], "email": user.get("email", ""), "phone": user.get("phone", ""),
                "product_id": None, "product_title": "Comunidade jotadev.ai", "interest": "Entrou na comunidade",
                "origin": "comunidade", "source": data.source, "keyword": data.keyword.upper(),
                "resource_slug": data.resource_slug, "user_id": user["user_id"], "status": "new", "created_at": now()})
        return {"joined_at": member["joined_at"], "new": True}

    @router.get("/overview")
    async def overview(user=Depends(optional_user)):
        # Público: a vitrine mostra membros e online para quem ainda não entrou; o onboarding só existe para membros.
        db = database()
        recent = await db.community_members.find({}, {"_id": 0, "name": 1}).sort("joined_at", -1).limit(6).to_list(6)
        public = {
            "members": await db.community_members.count_documents({}),
            "online": await db.community_presence.count_documents({"last_seen": {"$gte": ago(minutes=5)}}),
            "recent_members": [m["name"] for m in recent],
        }
        if user is None:
            return {**public, "onboarding": [], "vip_waitlist": False}
        uid = user["user_id"]
        steps = [
            ("apresente-se", "Apresente-se para a comunidade",
             await db.community_posts.find_one({"author.user_id": uid, "channel": "apresente-se", "deleted": False}, {"_id": 1}) is not None),
            ("material", "Baixe ou copie seu primeiro material",
             await db.community_downloads.find_one({"user_id": uid}, {"_id": 1}) is not None),
            ("conversa", "Participe de uma conversa no chat",
             await db.community_replies.find_one({"author.user_id": uid, "deleted": False}, {"_id": 1}) is not None
             or await db.community_posts.find_one({"author.user_id": uid, "channel": "chat", "deleted": False}, {"_id": 1}) is not None),
            ("reacao", "Reaja a uma publicação",
             await db.community_reactions.find_one({"user_id": uid}, {"_id": 1}) is not None),
        ]
        return {
            **public,
            "onboarding": [{"key": k, "label": label, "done": done} for k, label, done in steps],
            "vip_waitlist": await db.community_vip_waitlist.find_one({"_id": uid}, {"_id": 1}) is not None,
        }

    # ---------------------------------------------------------------- membros e seguir
    @router.get("/members")
    async def members(offset: int = Query(0, ge=0), user=Depends(optional_user)):
        # Lista pública como o "Juntado por" do Whop: só nome e foto, nunca e-mail.
        db = database()
        items = await db.community_members.find({}, {"_id": 0, "user_id": 1, "name": 1, "joined_at": 1}).sort("joined_at", -1).skip(offset).limit(51).to_list(51)
        page = items[:50]
        ids = [m["user_id"] for m in page]
        pictures = {u["user_id"]: u.get("picture", "") for u in await db.users.find({"user_id": {"$in": ids}}, {"_id": 0, "user_id": 1, "picture": 1}).to_list(len(ids) or 1)}
        following = set()
        if user:
            following = {f["target_id"] for f in await db.community_follows.find({"follower_id": user["user_id"], "target_id": {"$in": ids}}, {"_id": 0, "target_id": 1}).to_list(len(ids) or 1)}
        return {
            "items": [{"user_id": m["user_id"], "name": m["name"], "picture": pictures.get(m["user_id"], ""),
                       "following": m["user_id"] in following, "is_me": bool(user) and m["user_id"] == user["user_id"]} for m in page],
            "has_more": len(items) > 50,
            "total": await db.community_members.count_documents({}),
        }

    @router.put("/follows/{target_id}")
    async def follow(target_id: str, user=Depends(current_user)):
        db = database()
        if target_id == user["user_id"]:
            raise HTTPException(400, "Você não pode seguir a si mesmo.")
        if not await db.community_members.find_one({"_id": target_id}, {"_id": 1}):
            raise HTTPException(404, "Membro não encontrado.")
        await db.community_follows.update_one({"_id": f"{user['user_id']}:{target_id}"}, {"$setOnInsert": {
            "follower_id": user["user_id"], "target_id": target_id, "created_at": now()}}, upsert=True)
        return {"following": True}

    @router.delete("/follows/{target_id}")
    async def unfollow(target_id: str, user=Depends(current_user)):
        await database().community_follows.delete_one({"_id": f"{user['user_id']}:{target_id}"})
        return {"following": False}

    # ---------------------------------------------------------------- notificações e relatórios
    # Padrão: anúncios avisam sempre; nos demais canais só respostas às suas publicações.
    DEFAULT_PREFS = {c: ("todas" if c == "anuncios" else "respostas") for c in NOTIFY_CHANNELS}

    @router.get("/notification-prefs")
    async def get_prefs(user=Depends(current_user)):
        doc = await database().community_notification_prefs.find_one({"_id": user["user_id"]}, {"_id": 0, "channels": 1})
        return {"channels": {**DEFAULT_PREFS, **(doc or {}).get("channels", {})}}

    @router.put("/notification-prefs")
    async def set_prefs(data: NotificationPrefsInput, user=Depends(current_user)):
        db = database()
        current = (await db.community_notification_prefs.find_one({"_id": user["user_id"]}, {"_id": 0, "channels": 1}) or {}).get("channels", {})
        merged = {**DEFAULT_PREFS, **current, **data.channels}
        await db.community_notification_prefs.update_one({"_id": user["user_id"]}, {"$set": {"channels": merged, "updated_at": now()}}, upsert=True)
        return {"channels": merged}

    @router.post("/reports", status_code=201)
    async def report(data: ReportInput, user=Depends(current_user)):
        await database().community_reports.insert_one({"id": str(uuid.uuid4()), **data.model_dump(), "user_id": user["user_id"],
                                                        "name": user["name"], "status": "aberto", "created_at": now()})
        return {"ok": True}

    @router.get("/admin/reports")
    async def admin_reports(user=Depends(admin_user)):
        return await database().community_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

    @router.put("/vip-waitlist")
    async def vip_waitlist(user=Depends(current_user)):
        await database().community_vip_waitlist.update_one({"_id": user["user_id"]}, {"$setOnInsert": {
            "user_id": user["user_id"], "name": user["name"], "email": user.get("email", ""), "created_at": now()}}, upsert=True)
        return {"vip_waitlist": True}

    # ---------------------------------------------------------------- conteúdos
    # Vitrine pública: quem não entrou vê todos os materiais, mas só o resumo. Tutorial, requisitos e arquivo exigem conta.
    PUBLIC_FIELDS = {"_id": 0, "slug": 1, "title": 1, "summary": 1, "category": 1, "kind": 1, "level": 1, "status": 1,
                     "keyword": 1, "outcomes": 1, "video_url": 1, "video_vertical_url": 1, "version": 1, "updated_at": 1}

    @router.get("/resources")
    async def resources():
        return await database().community_resources.find({"published": True}, PUBLIC_FIELDS).sort("updated_at", -1).to_list(500)

    @router.get("/resources/{slug}")
    async def resource_detail(slug: str, user=Depends(current_user)):
        item = await resource(slug)
        return {k: v for k, v in item.items() if k not in {"workflow", "reviewed"}}

    @router.post("/resources/{slug}/download")
    async def download(slug: str, user=Depends(current_user)):
        item = await resource(slug)
        if item["status"] != "ready":
            raise HTTPException(409, "Este material está em preparação.")
        content = json.dumps(item["workflow"], ensure_ascii=False, indent=2) if item["kind"] == "Fluxo" else item["body"]
        await activity(user, "download", slug)
        await database().community_downloads.update_one({"_id": f"{user['user_id']}:{slug}"}, {"$set": {
            "user_id": user["user_id"], "slug": slug, "title": item["title"], "downloaded_at": now()
        }}, upsert=True)
        extension = "json" if item["kind"] == "Fluxo" else "md"
        return {"content": content, "filename": f"{slug}.{extension}", "mime": "application/json" if extension == "json" else "text/markdown"}

    @router.put("/saved/{slug}")
    async def save(slug: str, user=Depends(current_user)):
        await resource(slug)
        await database().community_saved.update_one({"_id": f"{user['user_id']}:{slug}"}, {"$setOnInsert": {
            "user_id": user["user_id"], "slug": slug, "created_at": now()
        }}, upsert=True)
        return {"saved": True}

    @router.delete("/saved/{slug}")
    async def unsave(slug: str, user=Depends(current_user)):
        await database().community_saved.delete_one({"_id": f"{user['user_id']}:{slug}"})
        return {"saved": False}

    @router.get("/me")
    async def me(user=Depends(current_user)):
        db = database()
        return {
            "saved": await db.community_saved.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500),
            "downloads": await db.community_downloads.find({"user_id": user["user_id"]}, {"_id": 0}).sort("downloaded_at", -1).to_list(500),
        }

    @router.post("/activity")
    async def track(data: ActivityInput, user=Depends(current_user)):
        if data.resource_slug:
            await resource(data.resource_slug)
        await activity(user, data.event, data.resource_slug)
        return {"ok": True}

    # ---------------------------------------------------------------- canais
    def author(user):
        return {"user_id": user["user_id"], "name": user["name"], "role": user.get("role", "user")}

    async def get_post(post_id):
        item = await database().community_posts.find_one({"id": post_id, "deleted": False}, {"_id": 0})
        if not item:
            raise HTTPException(404, "Publicação não encontrada.")
        return item

    async def with_my_reactions(items, user):
        ids = [p["id"] for p in items]
        mine = [] if user is None else await database().community_reactions.find(
            {"user_id": user["user_id"], "post_id": {"$in": ids}}, {"_id": 0, "post_id": 1, "kind": 1}).to_list(len(ids) * len(REACTIONS) or 1)
        for p in items:
            p.setdefault("reactions", {})
            p.setdefault("reply_count", 0)
            p["my_reactions"] = [r["kind"] for r in mine if r["post_id"] == p["id"]]
        return items

    @router.get("/posts")
    async def posts(channel: Literal["todos", "anuncios", "apresente-se", "chat"] = "todos", resource_slug: str | None = None,
                    offset: int = Query(0, ge=0), user=Depends(optional_user)):
        # Leitura pública, como na vitrine do Whop. Publicar, responder e reagir exigem conta.
        query = {"deleted": False}
        if channel != "todos":
            query["channel"] = channel
        if resource_slug:
            query["resource_slug"] = resource_slug
        items = await database().community_posts.find(query, {"_id": 0}).sort([("pinned", -1), ("created_at", -1)]).skip(offset).limit(21).to_list(21)
        return {"items": await with_my_reactions(items[:20], user), "has_more": len(items) > 20}

    @router.post("/posts", status_code=201)
    async def create_post(data: PostInput, user=Depends(current_user)):
        if data.channel == "anuncios" and user.get("role") != "admin":
            raise HTTPException(403, "Somente a equipe pode publicar anúncios.")
        if data.resource_slug:
            await resource(data.resource_slug)
        doc = {"id": str(uuid.uuid4()), **data.model_dump(), "author": author(user), "created_at": now(),
               "pinned": False, "locked": False, "deleted": False, "reactions": {}, "reply_count": 0}
        await database().community_posts.insert_one(dict(doc))
        await activity(user, "participation")
        return {**doc, "my_reactions": []}

    @router.get("/posts/{post_id}")
    async def post_detail(post_id: str, offset: int = Query(0, ge=0), user=Depends(optional_user)):
        item = (await with_my_reactions([await get_post(post_id)], user))[0]
        replies = await database().community_replies.find({"post_id": post_id, "deleted": False}, {"_id": 0}).sort("created_at", 1).skip(offset).limit(51).to_list(51)
        return {"post": item, "replies": replies[:50], "has_more": len(replies) > 50}

    @router.post("/posts/{post_id}/replies", status_code=201)
    async def reply(post_id: str, data: ReplyInput, user=Depends(current_user)):
        item = await get_post(post_id)
        if item["locked"]:
            raise HTTPException(409, "Esta conversa foi encerrada pela equipe.")
        doc = {"id": str(uuid.uuid4()), "post_id": post_id, "body": data.body, "author": author(user), "created_at": now(), "deleted": False}
        await database().community_replies.insert_one(dict(doc))
        await database().community_posts.update_one({"id": post_id}, {"$inc": {"reply_count": 1}})
        await activity(user, "participation")
        return doc

    @router.put("/posts/{post_id}/reactions/{kind}")
    async def react(post_id: str, kind: Literal["fogo", "palmas", "ideia", "coracao"], user=Depends(current_user)):
        await get_post(post_id)
        db = database()
        result = await db.community_reactions.update_one({"_id": f"{post_id}:{user['user_id']}:{kind}"}, {"$setOnInsert": {
            "post_id": post_id, "user_id": user["user_id"], "kind": kind, "created_at": now()}}, upsert=True)
        if result.upserted_id is not None:
            await db.community_posts.update_one({"id": post_id}, {"$inc": {f"reactions.{kind}": 1}})
        return {"ok": True}

    @router.delete("/posts/{post_id}/reactions/{kind}")
    async def unreact(post_id: str, kind: Literal["fogo", "palmas", "ideia", "coracao"], user=Depends(current_user)):
        await get_post(post_id)
        db = database()
        result = await db.community_reactions.delete_one({"_id": f"{post_id}:{user['user_id']}:{kind}"})
        if result.deleted_count:
            await db.community_posts.update_one({"id": post_id}, {"$inc": {f"reactions.{kind}": -1}})
        return {"ok": True}

    @router.delete("/posts/{post_id}")
    async def delete_post(post_id: str, user=Depends(current_user)):
        item = await get_post(post_id)
        if user.get("role") != "admin" and item["author"]["user_id"] != user["user_id"]:
            raise HTTPException(403, "Você só pode remover suas próprias publicações.")
        await database().community_posts.update_one({"id": post_id}, {"$set": {"deleted": True}})
        return {"ok": True}

    @router.delete("/posts/{post_id}/replies/{reply_id}")
    async def delete_reply(post_id: str, reply_id: str, user=Depends(current_user)):
        await get_post(post_id)
        item = await database().community_replies.find_one({"id": reply_id, "post_id": post_id, "deleted": False})
        if not item:
            raise HTTPException(404, "Resposta não encontrada.")
        if user.get("role") != "admin" and item["author"]["user_id"] != user["user_id"]:
            raise HTTPException(403, "Você só pode remover suas próprias respostas.")
        await database().community_replies.update_one({"id": reply_id}, {"$set": {"deleted": True}})
        await database().community_posts.update_one({"id": post_id}, {"$inc": {"reply_count": -1}})
        return {"ok": True}

    @router.patch("/posts/{post_id}/moderation")
    async def moderate(post_id: str, data: ModerationInput, user=Depends(admin_user)):
        await get_post(post_id)
        await database().community_posts.update_one({"id": post_id}, {"$set": data.model_dump()})
        return {"ok": True}

    # ---------------------------------------------------------------- encontros
    @router.get("/events")
    async def events():
        return await database().community_events.find({"published": True}, {"_id": 0, "join_url": 0, "recording_url": 0}).sort("starts_at", 1).to_list(500)

    @router.get("/events/{event_id}/access")
    async def event_access(event_id: str, user=Depends(current_user)):
        item = await database().community_events.find_one({"id": event_id, "published": True}, {"_id": 0})
        if not item:
            raise HTTPException(404, "Encontro não encontrado.")
        return {"join_url": item.get("join_url", ""), "recording_url": item.get("recording_url", "")}

    # ---------------------------------------------------------------- equipe
    @router.get("/admin/resources")
    async def admin_resources(user=Depends(admin_user)):
        return await database().community_resources.find({}, {"_id": 0}).sort("title", 1).to_list(500)

    @router.put("/admin/resources/{slug}")
    async def publish_resource(slug: str, data: ResourceInput, user=Depends(admin_user)):
        if slug != data.slug:
            raise HTTPException(400, "O endereço não corresponde ao material.")
        if data.keyword and await database().community_resources.find_one({"keyword": data.keyword, "slug": {"$ne": slug}}):
            raise HTTPException(409, f"A palavra-chave {data.keyword} já está em uso por outro material.")
        await database().community_resources.update_one({"slug": slug}, {"$set": {**data.model_dump(), "updated_at": now()}}, upsert=True)
        return {"ok": True}

    @router.get("/admin/events")
    async def admin_events(user=Depends(admin_user)):
        return await database().community_events.find({}, {"_id": 0}).sort("starts_at", -1).to_list(500)

    @router.put("/admin/events/{event_id}")
    async def publish_event(event_id: str, data: EventInput, user=Depends(admin_user)):
        doc = data.model_dump()
        doc["starts_at"] = data.starts_at.isoformat()
        await database().community_events.update_one({"id": event_id}, {"$set": {**doc, "id": event_id, "updated_at": now()}}, upsert=True)
        return {"ok": True}

    @router.get("/admin/metrics")
    async def metrics(user=Depends(admin_user)):
        db = database()
        since = ago(days=7)
        result = {}
        for event in ["download", "participation", "visit"]:
            result[event] = len(await db.community_activity.distinct("user_id", {"event": event, "created_at": {"$gte": since}}))
        visitors = await db.community_activity.find({"event": "visit", "created_at": {"$gte": since}}, {"_id": 0, "user_id": 1, "created_at": 1}).to_list(50000)
        days = {}
        for item in visitors:
            days.setdefault(item["user_id"], set()).add(item["created_at"][:10])
        result["returning"] = sum(len(d) > 1 for d in days.values())
        joins = await db.community_members.find({"joined_at": {"$gte": since}}, {"_id": 0, "source": 1, "keyword": 1}).to_list(50000)
        result["signup"] = len(joins)
        origins = {}
        for j in joins:
            key = (j.get("source") or "direto", j.get("keyword") or "")
            origins[key] = origins.get(key, 0) + 1
        result["origins"] = [{"source": s, "keyword": k, "members": n} for (s, k), n in sorted(origins.items(), key=lambda x: -x[1])]
        result["vip_waitlist"] = await db.community_vip_waitlist.count_documents({})
        result["period_days"] = 7
        return result

    return router


async def initialize_community(db):
    from community_seed import RESOURCES
    await db.community_resources.create_index("slug", unique=True)
    await db.community_resources.create_index("keyword")
    await db.community_posts.create_index([("deleted", 1), ("channel", 1), ("pinned", -1), ("created_at", -1)])
    await db.community_replies.create_index([("post_id", 1), ("created_at", 1)])
    await db.community_reactions.create_index([("user_id", 1), ("post_id", 1)])
    await db.community_events.create_index("id", unique=True)
    await db.community_activity.create_index([("event", 1), ("created_at", -1)])
    await db.community_members.create_index("joined_at")
    await db.community_presence.create_index("last_seen")
    await db.community_follows.create_index([("follower_id", 1), ("target_id", 1)])
    for item in RESOURCES:
        validated = ResourceInput(**item).model_dump()
        await db.community_resources.update_one({"slug": item["slug"]}, {"$setOnInsert": {**validated, "updated_at": now()}}, upsert=True)
        # Campos de entrega criados depois do material: o seed preenche uma única vez, sem sobrescrever edições.
        delivery = {k: validated[k] for k in ("keyword", "video_url", "video_vertical_url", "outcomes", "troubleshooting")}
        await db.community_resources.update_one({"slug": item["slug"], "outcomes": {"$exists": False}}, {"$set": delivery})
