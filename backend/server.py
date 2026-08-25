from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import secrets
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated, Dict, Any

import jwt
import bcrypt
import requests
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from pydantic import BaseModel, Field, EmailStr, BeforeValidator, ConfigDict

# ---------------------------------------------------------------------------
# DB & App setup
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("sentient-ai")

mongo_url = os.environ.get('MONGO_URL', '')
db_name = os.environ.get('DB_NAME', 'sentient_ai')
if not mongo_url:
    logger.error("MONGO_URL não configurada — defina essa variável no painel da Vercel (Settings > Environment Variables).")
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where()) if mongo_url else None
db = client[db_name] if client is not None else None

app = FastAPI(title="SENTIENT-AI Hub")


async def require_db():
    if db is None:
        raise HTTPException(status_code=503,
            detail="Banco de dados não configurado (MONGO_URL ausente). Configure as variáveis de ambiente na Vercel.")


api_router = APIRouter(prefix="/api", dependencies=[Depends(require_db)])

JWT_ALGORITHM = "HS256"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", os.environ.get("EMERGENT_LLM_KEY", ""))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class CategoryInput(BaseModel):
    name: str
    slug: Optional[str] = None
    icon: Optional[str] = "layers"
    description: Optional[str] = ""


class ProductInput(BaseModel):
    title: str
    short_description: str = ""
    description: str = ""
    category_id: Optional[str] = None
    category_name: Optional[str] = ""
    type: str = "free"  # free | paid
    price: float = 0.0
    thumbnail: str = ""
    checkout_url: str = ""
    download_url: str = ""
    tags: List[str] = []
    featured: bool = False


class LeadInput(BaseModel):
    product_id: Optional[str] = None
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    interest: Optional[str] = ""


class SkillInput(BaseModel):
    title: str
    category: str = "Geral"
    description: str = ""
    command: str = ""
    tags: List[str] = []


class CommunityLinkInput(BaseModel):
    name: str
    platform: str = "whatsapp"
    url: str
    description: str = ""
    icon: str = "message-circle"


class FAQInput(BaseModel):
    question: str
    answer: str
    category: str = "Geral"
    order: int = 0


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class ChatInput(BaseModel):
    message: str
    session_id: Optional[str] = None


class RecommendInput(BaseModel):
    query: str


class AutomationRunInput(BaseModel):
    trigger: str = "manual"


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user


async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador")
    return user


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api_router.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {"user_id": user_id, "email": email, "name": data.name,
           "password_hash": hash_password(data.password), "role": "user",
           "phone": "", "picture": "", "auth_provider": "password",
           "created_at": now_iso()}
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    await maybe_send_welcome_email(email, data.name)
    return {"user_id": user_id, "email": email, "name": data.name, "role": "user",
            "phone": "", "picture": "", "token": token}


@api_router.post("/auth/login")
async def login(data: LoginInput, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_access_token(user["user_id"], email)
    set_auth_cookie(response, token)
    return {"user_id": user["user_id"], "email": email, "name": user.get("name"),
            "role": user.get("role", "user"), "phone": user.get("phone", ""),
            "picture": user.get("picture", ""), "token": token}


@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id ausente")
    try:
        r = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}, timeout=15)
        r.raise_for_status()
        info = r.json()
    except Exception as e:
        logger.error(f"Google session error: {e}")
        raise HTTPException(status_code=401, detail="Falha ao validar sessão Google")
    email = info["email"].lower()
    user = await db.users.find_one({"email": email})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {"user_id": user_id, "email": email, "name": info.get("name", email),
                "password_hash": "", "role": "user", "phone": "",
                "picture": info.get("picture", ""), "auth_provider": "google",
                "created_at": now_iso()}
        await db.users.insert_one(user)
        await maybe_send_welcome_email(email, user["name"])
    token = create_access_token(user["user_id"], email)
    set_auth_cookie(response, token)
    return {"user_id": user["user_id"], "email": email, "name": user.get("name"),
            "role": user.get("role", "user"), "phone": user.get("phone", ""),
            "picture": user.get("picture", ""), "token": token}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return fresh


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
def slugify(text: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in text.lower()).strip("-")


@api_router.get("/categories")
async def list_categories():
    return await db.categories.find({}, {"_id": 0}).to_list(500)


@api_router.post("/categories")
async def create_category(data: CategoryInput, admin: dict = Depends(get_admin_user)):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["slug"] = data.slug or slugify(data.name)
    doc["created_at"] = now_iso()
    await db.categories.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/categories/{cat_id}")
async def update_category(cat_id: str, data: CategoryInput, admin: dict = Depends(get_admin_user)):
    updates = data.model_dump()
    updates["slug"] = data.slug or slugify(data.name)
    await db.categories.update_one({"id": cat_id}, {"$set": updates})
    return await db.categories.find_one({"id": cat_id}, {"_id": 0})


@api_router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, admin: dict = Depends(get_admin_user)):
    await db.categories.delete_one({"id": cat_id})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
@api_router.get("/products")
async def list_products(category: Optional[str] = None, type: Optional[str] = None,
                        search: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if category and category != "all":
        query["category_id"] = category
    if type and type in ("free", "paid"):
        query["type"] = type
    if featured is not None:
        query["featured"] = featured
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"short_description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]
    return await db.products.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    from pymongo import ReturnDocument
    p = await db.products.find_one_and_update(
        {"id": product_id}, {"$inc": {"views": 1}},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if not p:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return p


@api_router.post("/products")
async def create_product(data: ProductInput, admin: dict = Depends(get_admin_user)):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["views"] = 0
    doc["downloads"] = 0
    doc["created_at"] = now_iso()
    if data.category_id:
        cat = await db.categories.find_one({"id": data.category_id}, {"_id": 0})
        if cat:
            doc["category_name"] = cat["name"]
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductInput, admin: dict = Depends(get_admin_user)):
    updates = data.model_dump()
    if data.category_id:
        cat = await db.categories.find_one({"id": data.category_id}, {"_id": 0})
        if cat:
            updates["category_name"] = cat["name"]
    await db.products.update_one({"id": product_id}, {"$set": updates})
    return await db.products.find_one({"id": product_id}, {"_id": 0})


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    await db.products.delete_one({"id": product_id})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Leads + Free access / Downloads / Purchases
# ---------------------------------------------------------------------------
@api_router.post("/leads")
async def create_lead(data: LeadInput, request: Request):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    doc["status"] = "new"
    # attach user if logged in
    try:
        user = await get_current_user(request)
        doc["user_id"] = user["user_id"]
    except HTTPException:
        doc["user_id"] = None
    product = None
    if data.product_id:
        product = await db.products.find_one({"id": data.product_id}, {"_id": 0})
        doc["product_title"] = product["title"] if product else ""
    await db.leads.insert_one(doc)
    # record download if free product and logged in
    download_url = ""
    if product and product.get("type") == "free":
        download_url = product.get("download_url", "")
        if doc["user_id"]:
            await db.downloads.insert_one({
                "id": new_id(), "user_id": doc["user_id"], "product_id": product["id"],
                "product_title": product["title"], "thumbnail": product.get("thumbnail", ""),
                "download_url": download_url, "created_at": now_iso()})
        await db.products.update_one({"id": product["id"]}, {"$inc": {"downloads": 1}})
    await maybe_send_lead_notifications(doc, product)
    result = doc.copy()
    result.pop("_id", None)
    result["download_url"] = download_url
    return result


@api_router.post("/purchases/track")
async def track_purchase(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    product_id = body.get("product_id")
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    doc = {"id": new_id(), "user_id": user["user_id"], "product_id": product_id,
           "product_title": product["title"], "thumbnail": product.get("thumbnail", ""),
           "price": product.get("price", 0), "checkout_url": product.get("checkout_url", ""),
           "status": "redirected", "created_at": now_iso()}
    await db.purchases.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/account/downloads")
async def my_downloads(user: dict = Depends(get_current_user)):
    return await db.downloads.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.get("/account/purchases")
async def my_purchases(user: dict = Depends(get_current_user)):
    return await db.purchases.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.get("/admin/leads")
async def admin_leads(admin: dict = Depends(get_admin_user)):
    return await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)


@api_router.put("/admin/leads/{lead_id}")
async def update_lead(lead_id: str, request: Request, admin: dict = Depends(get_admin_user)):
    body = await request.json()
    await db.leads.update_one({"id": lead_id}, {"$set": {"status": body.get("status", "new")}})
    return {"ok": True}


@api_router.delete("/admin/leads/{lead_id}")
async def delete_lead(lead_id: str, admin: dict = Depends(get_admin_user)):
    await db.leads.delete_one({"id": lead_id})
    return {"ok": True}


@api_router.get("/admin/metrics")
async def admin_metrics(admin: dict = Depends(get_admin_user)):
    total_products = await db.products.count_documents({})
    total_leads = await db.leads.count_documents({})
    total_users = await db.users.count_documents({})
    total_downloads = await db.downloads.count_documents({})
    total_purchases = await db.purchases.count_documents({})
    free = await db.products.count_documents({"type": "free"})
    paid = await db.products.count_documents({"type": "paid"})
    top = await db.products.find({}, {"_id": 0, "title": 1, "views": 1, "downloads": 1}).sort("views", -1).to_list(5)
    recent_leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    return {"total_products": total_products, "total_leads": total_leads,
            "total_users": total_users, "total_downloads": total_downloads,
            "total_purchases": total_purchases, "free_products": free, "paid_products": paid,
            "top_products": top, "recent_leads": recent_leads}


# ---------------------------------------------------------------------------
# Skills / Community / FAQ
# ---------------------------------------------------------------------------
@api_router.get("/skills")
async def list_skills(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category and category != "all":
        query["category"] = category
    if search:
        query["$or"] = [{"title": {"$regex": search, "$options": "i"}},
                        {"description": {"$regex": search, "$options": "i"}}]
    return await db.skills.find(query, {"_id": 0}).to_list(1000)


@api_router.post("/skills")
async def create_skill(data: SkillInput, admin: dict = Depends(get_admin_user)):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    await db.skills.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/skills/{skill_id}")
async def update_skill(skill_id: str, data: SkillInput, admin: dict = Depends(get_admin_user)):
    await db.skills.update_one({"id": skill_id}, {"$set": data.model_dump()})
    return await db.skills.find_one({"id": skill_id}, {"_id": 0})


@api_router.delete("/skills/{skill_id}")
async def delete_skill(skill_id: str, admin: dict = Depends(get_admin_user)):
    await db.skills.delete_one({"id": skill_id})
    return {"ok": True}


@api_router.get("/community")
async def list_community():
    return await db.community_links.find({}, {"_id": 0}).to_list(500)


@api_router.post("/community")
async def create_community(data: CommunityLinkInput, admin: dict = Depends(get_admin_user)):
    doc = data.model_dump()
    doc["id"] = new_id()
    await db.community_links.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/community/{link_id}")
async def delete_community(link_id: str, admin: dict = Depends(get_admin_user)):
    await db.community_links.delete_one({"id": link_id})
    return {"ok": True}


@api_router.get("/faqs")
async def list_faqs():
    return await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(500)


@api_router.post("/faqs")
async def create_faq(data: FAQInput, admin: dict = Depends(get_admin_user)):
    doc = data.model_dump()
    doc["id"] = new_id()
    await db.faqs.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, admin: dict = Depends(get_admin_user)):
    await db.faqs.delete_one({"id": faq_id})
    return {"ok": True}


# ---------------------------------------------------------------------------
# AI: chat assistant (streaming) + recommendation
# ---------------------------------------------------------------------------
async def build_catalog_context() -> str:
    products = await db.products.find({}, {"_id": 0, "title": 1, "short_description": 1,
                                           "type": 1, "price": 1, "category_name": 1}).to_list(60)
    lines = []
    for p in products:
        tp = "GRÁTIS" if p.get("type") == "free" else f"PAGO R${p.get('price',0)}"
        lines.append(f"- {p['title']} [{p.get('category_name','')}] ({tp}): {p.get('short_description','')}")
    return "\n".join(lines) if lines else "Catálogo vazio no momento."


SYSTEM_ASSISTANT = (
    "Você é o assistente inteligente do SENTIENT-AI, um hub de produtos digitais, "
    "automações, templates, skills e ferramentas de IA. Responda sempre em português do Brasil, "
    "de forma amigável, objetiva e consultiva. Ajude o usuário a descobrir recursos do catálogo, "
    "tirar dúvidas sobre produtos e orientar sobre acesso gratuito ou compra. "
    "Use o catálogo abaixo como referência.\n\nCATÁLOGO:\n{catalog}"
)


@api_router.post("/ai/chat")
async def ai_chat(data: ChatInput):
    import anthropic as _anthropic
    session_id = data.session_id or new_id()
    catalog = await build_catalog_context()
    # persist user message
    await db.chat_messages.insert_one({"id": new_id(), "session_id": session_id,
                                       "role": "user", "content": data.message, "created_at": now_iso()})

    async def event_generator():
        full = ""
        if not ANTHROPIC_API_KEY:
            msg = "O assistente de IA está temporariamente indisponível (chave não configurada)."
            await db.chat_messages.insert_one({"id": new_id(), "session_id": session_id,
                                               "role": "assistant", "content": msg, "created_at": now_iso()})
            yield msg
            return
        try:
            client_ai = _anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
            async with client_ai.messages.stream(
                model="claude-sonnet-4-5",
                max_tokens=1024,
                system=SYSTEM_ASSISTANT.format(catalog=catalog),
                messages=[{"role": "user", "content": data.message}],
            ) as stream:
                async for text in stream.text_stream:
                    full += text
                    yield text
        except Exception as e:
            logger.error(f"AI chat error: {e}")
            yield "Desculpe, tive um problema para responder agora. Tente novamente."
        await db.chat_messages.insert_one({"id": new_id(), "session_id": session_id,
                                           "role": "assistant", "content": full, "created_at": now_iso()})

    return StreamingResponse(event_generator(), media_type="text/plain",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no",
                                      "X-Session-Id": session_id})


@api_router.post("/ai/recommend")
async def ai_recommend(data: RecommendInput):
    import anthropic as _anthropic
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    if not products:
        return {"recommendations": [], "reasoning": "Catálogo vazio."}
    catalog = "\n".join([f"ID:{p['id']} | {p['title']} | {p.get('category_name','')} | "
                         f"{p.get('type')} | {p.get('short_description','')}" for p in products])
    sys_msg = ("Você é um motor de recomendação do SENTIENT-AI. Dado o interesse do usuário e o catálogo, "
               "escolha até 4 produtos mais relevantes. Responda APENAS com IDs separados por vírgula, "
               "na ordem de relevância. Sem texto extra.")
    if not ANTHROPIC_API_KEY:
        return {"recommendations": products[:4], "reasoning": "IA indisponível (chave não configurada)."}
    try:
        client_ai = _anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        resp = await client_ai.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=256,
            system=sys_msg,
            messages=[{"role": "user", "content": f"Interesse: {data.query}\n\nCATÁLOGO:\n{catalog}"}],
        )
        raw = resp.content[0].text if resp.content else ""
        ids = [i.strip() for i in raw.replace("\n", ",").split(",") if i.strip()]
        clean_ids = [i.replace("ID:", "").strip() for i in ids]
        by_id = {p["id"]: p for p in products}
        recs = [by_id[i] for i in clean_ids if i in by_id][:4]
        if not recs:
            recs = products[:4]
        return {"recommendations": recs}
    except Exception as e:
        logger.error(f"AI recommend error: {e}")
        return {"recommendations": products[:4]}


# ---------------------------------------------------------------------------
# Integrations: Email (Resend) + WhatsApp (Twilio) — graceful if no key
# ---------------------------------------------------------------------------
async def maybe_send_welcome_email(email: str, name: str):
    key = os.environ.get("RESEND_API_KEY", "")
    if not key:
        logger.info(f"[EMAIL inativo] boas-vindas para {email}")
        return
    try:
        await asyncio.to_thread(requests.post, "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"from": os.environ.get("RESEND_FROM_EMAIL"), "to": [email],
                  "subject": "Bem-vindo ao SENTIENT-AI",
                  "html": f"<h2>Olá {name}!</h2><p>Sua conta no SENTIENT-AI foi criada. Explore nossos recursos digitais.</p>"},
            timeout=15)
    except Exception as e:
        logger.error(f"Resend welcome error: {e}")


async def maybe_send_lead_notifications(lead: dict, product: Optional[dict]):
    title = product["title"] if product else "recurso"
    # Email confirmation
    key = os.environ.get("RESEND_API_KEY", "")
    if key:
        try:
            await asyncio.to_thread(requests.post, "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={"from": os.environ.get("RESEND_FROM_EMAIL"), "to": [lead["email"]],
                      "subject": f"Seu acesso: {title}",
                      "html": f"<h2>Olá {lead['name']}!</h2><p>Recebemos seu interesse em <b>{title}</b>. "
                              f"Em breve entraremos em contato.</p>"}, timeout=15)
        except Exception as e:
            logger.error(f"Resend lead error: {e}")
    else:
        logger.info(f"[EMAIL inativo] lead {lead['email']} para {title}")
    # WhatsApp via Twilio
    sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    tok = os.environ.get("TWILIO_AUTH_TOKEN", "")
    if sid and tok and lead.get("phone"):
        try:
            await asyncio.to_thread(requests.post,
                f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                data={"From": os.environ.get("TWILIO_WHATSAPP_FROM"),
                      "To": f"whatsapp:{lead['phone']}",
                      "Body": f"Olá {lead['name']}! Recebemos seu interesse em {title} no SENTIENT-AI. 🚀"},
                auth=(sid, tok), timeout=15)
        except Exception as e:
            logger.error(f"Twilio error: {e}")
    else:
        logger.info(f"[WHATSAPP inativo] lead {lead.get('phone')} para {title}")


# ---------------------------------------------------------------------------
# Automation hub: connection tree, status and executions
# ---------------------------------------------------------------------------
def _clean_automation_node(raw: dict) -> dict:
    node = {key: value for key, value in raw.items() if key != "_id"}
    meta = dict(node.get("meta") or {})
    for key in ("description", "model", "provider"):
        if key in node and key not in meta:
            meta[key] = node.pop(key)
    node["meta"] = meta
    node.setdefault("children", [])
    return node


def _build_automation_tree(raw_nodes: list[dict]) -> dict:
    nodes = {_node["id"]: _clean_automation_node(_node) for _node in raw_nodes}
    roots = []
    for node in nodes.values():
        parent_id = node.pop("parent_id", None)
        if parent_id and parent_id in nodes:
            nodes[parent_id].setdefault("children", []).append(node)
        else:
            roots.append(node)
    roots.sort(key=lambda item: item.get("order", 0))
    if not roots:
        return {"id": "sentient-root", "name": "SENTIENT-AI", "type": "root", "children": []}
    return roots[0]


async def _get_automation_node(node_id: str) -> dict:
    node = await db.automation_nodes.find_one({"id": node_id}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Nó de automação não encontrado")
    return node


async def _execute_automation_node(node: dict, trigger: str = "manual") -> dict:
    started_at = datetime.now(timezone.utc)
    # O MVP usa a camada persistida do SENTIENT-AI. Quando um webhook n8n for
    # configurado no registro, a integração pode ser adicionada sem alterar o contrato.
    await asyncio.sleep(0)
    duration = round(max((datetime.now(timezone.utc) - started_at).total_seconds(), 0.1), 2)
    execution = {
        "id": new_id(),
        "node_id": node["id"],
        "node_name": node["name"],
        "status": "success",
        "trigger": trigger,
        "duration_seconds": duration,
        "started_at": started_at.isoformat(),
        "finished_at": now_iso(),
    }
    await db.automation_executions.insert_one(execution)
    await db.automation_nodes.update_one(
        {"id": node["id"]},
        {"$set": {"last_execution": execution["finished_at"], "status": "active"}},
    )
    execution.pop("_id", None)
    return execution


@api_router.get("/tree")
async def automation_tree(admin: dict = Depends(get_admin_user)):
    raw_nodes = await db.automation_nodes.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    return _build_automation_tree(raw_nodes)


@api_router.get("/nodes/{node_id}/stats")
async def automation_node_stats(node_id: str, admin: dict = Depends(get_admin_user)):
    await _get_automation_node(node_id)
    executions = await db.automation_executions.find({"node_id": node_id}, {"_id": 0}).sort("started_at", -1).to_list(500)
    total = len(executions)
    successful = sum(1 for execution in executions if execution.get("status") == "success")
    durations = [float(execution.get("duration_seconds", 0)) for execution in executions]
    return {
        "executions_24h": sum(
            1 for execution in executions
            if execution.get("started_at", "") >= (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        ),
        "success_rate": round((successful / total) * 100, 1) if total else 0,
        "avg_time_seconds": round(sum(durations) / len(durations), 2) if durations else 0,
        "last_execution": executions[0].get("finished_at") if executions else None,
    }


@api_router.get("/nodes/{node_id}/executions")
async def automation_node_executions(node_id: str, admin: dict = Depends(get_admin_user), limit: int = 12):
    await _get_automation_node(node_id)
    safe_limit = max(1, min(limit, 100))
    return await db.automation_executions.find(
        {"node_id": node_id}, {"_id": 0}
    ).sort("started_at", -1).to_list(safe_limit)


@api_router.get("/status")
async def automation_status(admin: dict = Depends(get_admin_user)):
    from seed import TECH_STACK_AUTOMATIONS_ACTIVE, TECH_STACK_CONNECTIONS_ACTIVE, TECH_STACK_EXECUTIONS_24H, TECH_STACK_SAVINGS_MONTH_CENTS
    saved = await db.automation_status.find_one({"id": "system"}, {"_id": 0}) or {
        "automations_active": TECH_STACK_AUTOMATIONS_ACTIVE,
        "executions_24h": TECH_STACK_EXECUTIONS_24H,
        "savings_month_cents": TECH_STACK_SAVINGS_MONTH_CENTS,
        "connections_active": TECH_STACK_CONNECTIONS_ACTIVE,
    }
    active_nodes = await db.automation_nodes.count_documents({"type": "agent", "status": "active"})
    recent_executions = await db.automation_executions.count_documents({
        "started_at": {"$gte": (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()}
    })
    connections = await db.automation_nodes.count_documents({"type": "tool"})
    return {
        "automations_active": active_nodes or saved.get("automations_active", 0),
        "executions_24h": recent_executions or saved.get("executions_24h", 0),
        "savings_month_cents": saved.get("savings_month_cents", 0),
        "connections_active": connections or saved.get("connections_active", 0),
        "api_online": True,
        "n8n_connected": bool(os.environ.get("N8N_BASE_URL")),
    }


@api_router.post("/automations/run-all")
async def run_all_automations(admin: dict = Depends(get_admin_user)):
    nodes = await db.automation_nodes.find({"type": "agent"}, {"_id": 0}).sort("order", 1).to_list(500)
    results = []
    for node in nodes:
        if node.get("status") == "waiting_approval":
            results.append({"node_id": node["id"], "node_name": node["name"], "status": "blocked", "message": "Aguardando aprovação"})
            continue
        try:
            execution = await _execute_automation_node(node, trigger="run-all")
            results.append({"node_id": node["id"], "node_name": node["name"], "status": execution["status"], "execution_id": execution["id"]})
        except Exception as exc:
            logger.exception("Falha ao executar %s", node.get("id"))
            results.append({"node_id": node["id"], "node_name": node["name"], "status": "error", "message": str(exc)})
    succeeded = sum(1 for result in results if result["status"] == "success")
    failed = sum(1 for result in results if result["status"] == "error")
    blocked = sum(1 for result in results if result["status"] == "blocked")
    return {"ok": failed == 0, "total": len(results), "succeeded": succeeded, "failed": failed, "blocked": blocked, "results": results}


@api_router.post("/automations/{automation_id}/run")
async def run_automation(automation_id: str, data: AutomationRunInput, admin: dict = Depends(get_admin_user)):
    node = await _get_automation_node(automation_id)
    if node.get("type") != "agent":
        raise HTTPException(status_code=400, detail="Apenas agentes podem ser executados")
    if node.get("status") == "waiting_approval":
        raise HTTPException(status_code=409, detail="Esta automação aguarda aprovação")
    execution = await _execute_automation_node(node, trigger=data.trigger)
    return {"ok": True, "execution": execution}


# ---------------------------------------------------------------------------
# Unified search (command palette)
# ---------------------------------------------------------------------------
@api_router.get("/search")
async def unified_search(q: Optional[str] = None):
    if not q or not q.strip():
        cats = await db.categories.find({}, {"_id": 0}).to_list(20)
        popular = await db.products.find({}, {"_id": 0}).sort("views", -1).to_list(5)
        return {"products": [], "skills": [], "faqs": [], "categories": cats, "popular": popular}
    rx = {"$regex": q.strip(), "$options": "i"}
    products = await db.products.find(
        {"$or": [{"title": rx}, {"short_description": rx}, {"tags": rx}, {"category_name": rx}]},
        {"_id": 0}).limit(6).to_list(6)
    skills = await db.skills.find(
        {"$or": [{"title": rx}, {"description": rx}, {"category": rx}]},
        {"_id": 0}).limit(5).to_list(5)
    faqs = await db.faqs.find(
        {"$or": [{"question": rx}, {"answer": rx}]},
        {"_id": 0}).limit(4).to_list(4)
    return {"products": products, "skills": skills, "faqs": faqs, "categories": [], "popular": []}


@api_router.get("/")
async def root():
    return {"message": "SENTIENT-AI Hub API", "status": "online"}


app.include_router(api_router)

_cors_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]
if not _cors_origins or _cors_origins == ["*"]:
    logger.warning("CORS_ORIGINS não configurada corretamente (vazia ou '*') — "
                    "com allow_credentials=True o navegador exige uma origem explícita. "
                    "Usando regex coringa como fallback; configure CORS_ORIGINS com a URL exata do frontend.")
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origin_regex=".*",
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=_cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ---------------------------------------------------------------------------
# Startup: indexes + seed
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    if db is None:
        logger.error("Startup ignorado: MONGO_URL não configurada. As rotas que usam o banco vão retornar erro 503.")
        return
    try:
        await asyncio.wait_for(_run_startup_tasks(), timeout=8)
    except Exception as e:
        logger.error(f"Startup com banco falhou (app segue no ar, mas rotas de dados podem falhar): {e}")


async def _run_startup_tasks():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@sentient-ai.com").lower()
    admin_pass = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"user_id": f"user_{uuid.uuid4().hex[:12]}", "email": admin_email,
                                   "name": "Administrador", "password_hash": hash_password(admin_pass),
                                   "role": "admin", "phone": "", "picture": "", "auth_provider": "password",
                                   "created_at": now_iso()})
    elif not verify_password(admin_pass, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pass), "role": "admin"}})
    await seed_data()


@app.on_event("shutdown")
async def shutdown():
    client.close()


async def seed_data():
    from seed import (
        SEED_CATEGORIES, SEED_PRODUCTS, SEED_SKILLS, SEED_COMMUNITY, SEED_FAQS,
        SEED_AUTOMATION_NODES, SEED_AUTOMATION_EXECUTIONS,
        TECH_STACK_AUTOMATIONS_ACTIVE, TECH_STACK_EXECUTIONS_24H,
        TECH_STACK_SAVINGS_MONTH_CENTS, TECH_STACK_CONNECTIONS_ACTIVE,
    )
    if await db.categories.count_documents({}) == 0:
        cat_map = {}
        for c in SEED_CATEGORIES:
            cid = new_id()
            cat_map[c["slug"]] = {"id": cid, "name": c["name"]}
            await db.categories.insert_one({"id": cid, "name": c["name"], "slug": c["slug"],
                                            "icon": c["icon"], "description": c["description"],
                                            "created_at": now_iso()})
        for p in SEED_PRODUCTS:
            cat = cat_map.get(p["cat_slug"], {})
            await db.products.insert_one({
                "id": new_id(), "title": p["title"], "short_description": p["short_description"],
                "description": p["description"], "category_id": cat.get("id"),
                "category_name": cat.get("name", ""), "type": p["type"], "price": p["price"],
                "thumbnail": p["thumbnail"], "checkout_url": p.get("checkout_url", ""),
                "download_url": p.get("download_url", ""), "tags": p["tags"],
                "featured": p.get("featured", False), "views": p.get("views", 0),
                "downloads": p.get("downloads", 0), "created_at": now_iso()})
    if await db.skills.count_documents({}) == 0:
        for s in SEED_SKILLS:
            await db.skills.insert_one({"id": new_id(), **s, "created_at": now_iso()})
    if await db.community_links.count_documents({}) == 0:
        for l in SEED_COMMUNITY:
            await db.community_links.insert_one({"id": new_id(), **l})
    if await db.faqs.count_documents({}) == 0:
        for i, f in enumerate(SEED_FAQS):
            await db.faqs.insert_one({"id": new_id(), **f, "order": i})
    if await db.automation_nodes.count_documents({}) == 0:
        for node in SEED_AUTOMATION_NODES:
            await db.automation_nodes.insert_one({**node, "created_at": now_iso()})
    if await db.automation_executions.count_documents({}) == 0:
        for seed_execution in SEED_AUTOMATION_EXECUTIONS:
            execution = {key: value for key, value in seed_execution.items() if key != "minutes_ago"}
            started_at = datetime.now(timezone.utc) - timedelta(minutes=seed_execution["minutes_ago"])
            finished_at = started_at + timedelta(seconds=float(execution.get("duration_seconds", 0)))
            await db.automation_executions.insert_one({
                "id": new_id(),
                **execution,
                "node_name": next((node["name"] for node in SEED_AUTOMATION_NODES if node["id"] == execution["node_id"]), execution["node_id"]),
                "trigger": "seed",
                "started_at": started_at.isoformat(),
                "finished_at": finished_at.isoformat(),
            })
    await db.automation_status.update_one(
        {"id": "system"},
        {"$setOnInsert": {
            "id": "system",
            "automations_active": TECH_STACK_AUTOMATIONS_ACTIVE,
            "executions_24h": TECH_STACK_EXECUTIONS_24H,
            "savings_month_cents": TECH_STACK_SAVINGS_MONTH_CENTS,
            "connections_active": TECH_STACK_CONNECTIONS_ACTIVE,
        }},
        upsert=True,
    )
