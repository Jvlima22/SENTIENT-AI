"""Integration tests use an isolated database and the application's real auth dependencies."""
import asyncio
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

os.environ["MONGO_URL"] = ""
os.environ["JWT_SECRET"] = "community-isolated-test-secret-not-for-production"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient
import server
from community import initialize_community

BASE = "/api/community-hub"

# Material pronto usado só nos testes (o seed publica apenas o fluxo do CNPJ, ainda sem arquivo).
SAMPLE_READY = {
    "slug": "speed-to-lead", "title": "Receba seu próximo lead", "summary": "Capture, valide e confirme um contato com n8n.",
    "category": "Atendimento", "kind": "Fluxo", "level": "Iniciante", "status": "ready", "reviewed": True,
    "steps": ["Importe o fluxo no n8n.", "Envie um POST de teste."], "body": "Núcleo de captura de leads.",
    "workflow": json.loads((Path(__file__).resolve().parents[1] / "community_assets" / "speed-to-lead.json").read_text(encoding="utf-8")),
}


async def publish_sample(database):
    from community import ResourceInput, now
    await database.community_resources.insert_one({**ResourceInput(**SAMPLE_READY).model_dump(), "updated_at": now()})


@pytest.fixture
def clients(monkeypatch):
    database = AsyncMongoMockClient()["community_test"]
    monkeypatch.setattr(server, "db", database)
    async def no_email(*args):
        pass
    monkeypatch.setattr(server, "maybe_send_welcome_email", no_email)
    asyncio.run(initialize_community(database))
    asyncio.run(publish_sample(database))
    anonymous = TestClient(server.app)
    member = TestClient(server.app)
    other = TestClient(server.app)
    admin = TestClient(server.app)
    for client, name in [(member, "Membro"), (other, "Outro"), (admin, "Equipe")]:
        result = client.post("/api/auth/register", json={"name": name, "email": name.lower()+"@example.com", "password": "test-password-123"})
        assert result.status_code == 200
    asyncio.run(database.users.update_one({"email": "equipe@example.com"}, {"$set": {"role": "admin"}}))
    yield anonymous, member, other, admin, database
    for client in [anonymous, member, other, admin]:
        client.close()


def test_showcase_is_public_but_material_pages_and_actions_require_login(clients):
    anon, member, _, admin, _ = clients
    # Vitrine pública: lista de materiais (só o resumo), canais, encontros e contagem de membros.
    resources = anon.get(BASE+"/resources").json()
    assert sorted(r["slug"] for r in resources) == ["decisores", "speed-to-lead"]
    assert all(not ({"workflow", "body", "steps", "requirements", "reviewed"} & r.keys()) for r in resources)
    assert anon.get(BASE+"/posts?channel=chat").status_code == 200
    assert anon.get(BASE+"/events").status_code == 200
    public = anon.get(BASE+"/overview").json()
    assert public["onboarding"] == [] and "members" in public
    member.post(BASE+"/posts", json={"body": "Oi, pessoal!", "channel": "chat"})
    item = anon.get(BASE+"/posts?channel=chat").json()["items"][0]
    assert item["my_reactions"] == [] and "email" not in item["author"]
    assert anon.get(BASE+"/posts/"+item["id"]).status_code == 200
    # Página do material, arquivos e qualquer ação exigem conta.
    for path in ["/resources/speed-to-lead", "/me", "/admin/resources", "/admin/events", "/admin/metrics", "/events/x/access"]:
        assert anon.get(BASE+path).status_code == 401, path
    for path in ["/resources/speed-to-lead/download", "/join", "/posts", "/posts/"+item["id"]+"/replies"]:
        assert anon.post(BASE+path, json={"body": "x", "channel": "chat"}).status_code == 401, path
    assert anon.put(BASE+"/posts/"+item["id"]+"/reactions/fogo").status_code == 401
    assert anon.put(BASE+"/vip-waitlist").status_code == 401
    assert anon.get(BASE+"/go/cnpj").json() == {"slug": "decisores"}
    assert anon.get(BASE+"/go/nada").status_code == 404
    assert "workflow" not in member.get(BASE+"/resources/speed-to-lead").json()
    assert member.get(BASE+"/resources/speed-to-lead").json()["steps"]
    assert member.get(BASE+"/admin/resources").status_code == 403
    assert admin.get(BASE+"/admin/resources").status_code == 200
    assert member.post(BASE+"/resources/decisores/download").status_code == 409


def test_join_records_origin_once_and_feeds_overview(clients):
    _, member, other, admin, db = clients
    first = member.post(BASE+"/join", json={"source": "instagram", "keyword": "cnpj", "resource_slug": "decisores"}).json()
    assert first["new"] is True
    assert member.post(BASE+"/join", json={"source": "direto"}).json()["new"] is False
    assert other.post(BASE+"/join", json={"source": "bad source!"}).status_code == 422
    assert other.post(BASE+"/join", json={}).status_code == 200
    leads = asyncio.run(db.leads.find({"origin": "comunidade"}).to_list(10))
    assert len(leads) == 2
    reel = next(l for l in leads if l["source"] == "instagram")
    assert reel["keyword"] == "CNPJ" and reel["email"] == "membro@example.com"
    view = member.get(BASE+"/overview").json()
    assert view["members"] == 2 and view["online"] == 2
    assert view["recent_members"][0] == "Outro"
    assert [s["done"] for s in view["onboarding"]] == [False, False, False, False]
    assert member.put(BASE+"/vip-waitlist").status_code == 200
    assert member.put(BASE+"/vip-waitlist").status_code == 200
    assert member.get(BASE+"/overview").json()["vip_waitlist"] is True
    metrics = admin.get(BASE+"/admin/metrics").json()
    assert metrics["signup"] == 2 and metrics["vip_waitlist"] == 1
    assert {"source": "instagram", "keyword": "CNPJ", "members": 1} in metrics["origins"]


def test_download_bookmark_and_history_are_private_and_persistent(clients):
    _, member, other, _, _ = clients
    slug = "speed-to-lead"
    result = member.post(BASE+"/resources/"+slug+"/download")
    assert result.status_code == 200
    workflow = json.loads(result.json()["content"])
    assert workflow["active"] is False
    assert not workflow.get("pinData")
    assert all(not n.get("credentials") for n in workflow["nodes"])
    context = next(n for n in workflow["nodes"] if n["name"] == "Preparar contexto comercial")
    assert context["parameters"]["includeOtherFields"] is True
    assert member.put(BASE+"/saved/"+slug).status_code == 200
    assert member.put(BASE+"/saved/"+slug).status_code == 200
    mine = member.get(BASE+"/me").json()
    assert len(mine["saved"]) == 1
    assert mine["downloads"][0]["slug"] == slug
    assert other.get(BASE+"/me").json() == {"saved": [], "downloads": []}
    assert member.delete(BASE+"/saved/"+slug).status_code == 200
    assert member.get(BASE+"/me").json()["saved"] == []
    assert member.put(BASE+"/saved/missing").status_code == 404


def test_channels_replies_permissions_and_moderation(clients):
    _, member, other, admin, _ = clients
    payload = {"title": "Minha primeira dúvida", "body": "Como validar o primeiro contato?", "channel": "chat", "resource_slug": "speed-to-lead"}
    p = member.post(BASE+"/posts", json=payload)
    assert p.status_code == 201
    pid = p.json()["id"]
    assert "email" not in p.json()["author"]
    assert member.get(BASE+"/posts?resource_slug=speed-to-lead").json()["items"][0]["id"] == pid
    assert member.post(BASE+"/posts", json={**payload, "channel": "anuncios"}).status_code == 403
    assert admin.post(BASE+"/posts", json={**payload, "channel": "anuncios"}).status_code == 201
    assert member.post(BASE+"/posts", json={"body": "Oi, sou a Ana e automatizo atendimento.", "channel": "apresente-se"}).status_code == 201
    assert len(member.get(BASE+"/posts?channel=apresente-se").json()["items"]) == 1
    assert member.post(BASE+"/posts", json={**payload, "resource_slug": "missing"}).status_code == 404
    assert member.post(BASE+"/posts", json={**payload, "body": "    "}).status_code == 422
    assert other.delete(BASE+"/posts/"+pid).status_code == 403
    assert member.patch(BASE+"/posts/"+pid+"/moderation", json={"pinned": True}).status_code == 403
    reply = other.post(BASE+"/posts/"+pid+"/replies", json={"body": "Teste também um e-mail inválido."})
    assert reply.status_code == 201
    rid = reply.json()["id"]
    detail = member.get(BASE+"/posts/"+pid).json()
    assert detail["replies"][0]["id"] == rid and detail["post"]["reply_count"] == 1
    assert member.delete(BASE+"/posts/"+pid+"/replies/"+rid).status_code == 403
    assert admin.patch(BASE+"/posts/"+pid+"/moderation", json={"pinned": True, "locked": True}).status_code == 200
    assert other.post(BASE+"/posts/"+pid+"/replies", json={"body": "Mais uma"}).status_code == 409
    assert admin.delete(BASE+"/posts/"+pid+"/replies/"+rid).status_code == 200
    assert member.get(BASE+"/posts/"+pid).json()["post"]["reply_count"] == 0
    assert admin.delete(BASE+"/posts/"+pid).status_code == 200
    assert member.get(BASE+"/posts/"+pid).status_code == 404


def test_reactions_count_once_per_person_and_complete_onboarding(clients):
    _, member, other, _, _ = clients
    pid = other.post(BASE+"/posts", json={"body": "Rodei o fluxo de leads!", "channel": "chat"}).json()["id"]
    for _ in range(2):
        assert member.put(BASE+"/posts/"+pid+"/reactions/fogo").status_code == 200
    assert other.put(BASE+"/posts/"+pid+"/reactions/fogo").status_code == 200
    assert member.put(BASE+"/posts/"+pid+"/reactions/raiva").status_code == 422
    item = member.get(BASE+"/posts?channel=chat").json()["items"][0]
    assert item["reactions"]["fogo"] == 2 and item["my_reactions"] == ["fogo"]
    assert member.delete(BASE+"/posts/"+pid+"/reactions/fogo").status_code == 200
    assert member.delete(BASE+"/posts/"+pid+"/reactions/fogo").status_code == 200
    item = member.get(BASE+"/posts/"+pid).json()["post"]
    assert item["reactions"]["fogo"] == 1 and item["my_reactions"] == []
    member.put(BASE+"/posts/"+pid+"/reactions/ideia")
    member.post(BASE+"/posts/"+pid+"/replies", json={"body": "Boa!"})
    member.post(BASE+"/posts", json={"body": "Oi, pessoal!", "channel": "apresente-se"})
    member.post(BASE+"/resources/speed-to-lead/download")
    member.post(BASE+"/join", json={})
    assert all(s["done"] for s in member.get(BASE+"/overview").json()["onboarding"])


def test_resource_publication_validation_and_hidden_files(clients):
    _, member, _, admin, _ = clients
    resource = next(r for r in admin.get(BASE+"/admin/resources").json() if r["slug"] == "decisores")
    resource.pop("updated_at")
    assert resource["video_vertical_url"].endswith("9x16.mp4")
    assert admin.put(BASE+"/admin/resources/decisores", json={**resource, "status": "ready", "reviewed": True}).status_code == 422
    assert admin.put(BASE+"/admin/resources/decisores", json={**resource, "video_url": "http://inseguro.com/v.mp4"}).status_code == 422
    assert admin.put(BASE+"/admin/resources/decisores", json={**resource, "video_url": "/../segredo.mp4"}).status_code == 422
    speed = next(r for r in admin.get(BASE+"/admin/resources").json() if r["slug"] == "speed-to-lead")
    speed.pop("updated_at")
    assert admin.put(BASE+"/admin/resources/speed-to-lead", json={**speed, "keyword": "cnpj"}).status_code == 409
    resource["published"] = False
    assert admin.put(BASE+"/admin/resources/decisores", json=resource).status_code == 200
    assert member.get(BASE+"/resources/decisores").status_code == 404
    assert member.put(BASE+"/saved/decisores").status_code == 404
    assert member.put(BASE+"/admin/resources/decisores", json=resource).status_code == 403
    # Referências de credencial e pinData do export do n8n são removidas automaticamente.
    workflow = {"nodes": [{"name": "HTTP", "type": "n8n-nodes-base.httpRequest", "credentials": {"httpHeaderAuth": {"id": "abc", "name": "Minha conta"}}}],
                "connections": {}, "pinData": {"HTTP": [{"json": {"cliente": "privado"}}]}, "meta": {"instanceId": "x"}}
    assert admin.put(BASE+"/admin/resources/decisores", json={**resource, "workflow": workflow}).status_code == 200
    stored = next(r for r in admin.get(BASE+"/admin/resources").json() if r["slug"] == "decisores")["workflow"]
    assert "credentials" not in stored["nodes"][0] and "pinData" not in stored and "meta" not in stored and stored["active"] is False
    workflow = {"nodes": [{"name": "HTTP", "type": "n8n-nodes-base.httpRequest"}], "connections": {}}
    workflow["nodes"][0]["parameters"] = {"value": "Bearer abcdefghijklmnopqrstuvwxyz12345"}
    assert admin.put(BASE+"/admin/resources/decisores", json={**resource, "workflow": workflow}).status_code == 422
    workflow["nodes"][0]["parameters"] = {}
    resource.update(workflow=workflow, status="ready", reviewed=True, published=True)
    assert admin.put(BASE+"/admin/resources/decisores", json=resource).status_code == 200
    assert "workflow" not in member.get(BASE+"/resources/decisores").json()
    assert member.post(BASE+"/resources/decisores/download").status_code == 200


def test_events_hide_links_and_validate_timezone_and_urls(clients):
    _, member, _, admin, _ = clients
    payload = {"title": "Encontro de implementação", "description": "Vamos instalar um fluxo juntos.", "starts_at": "2027-01-10T19:00:00-03:00", "join_url": "https://example.com/reuniao", "recording_url": "", "published": True}
    assert member.put(BASE+"/admin/events/first", json=payload).status_code == 403
    assert admin.put(BASE+"/admin/events/first", json={**payload, "join_url": "javascript:alert(1)"}).status_code == 422
    assert admin.put(BASE+"/admin/events/first", json={**payload, "starts_at": "2027-01-10T19:00:00"}).status_code == 422
    assert admin.put(BASE+"/admin/events/first", json=payload).status_code == 200
    public = member.get(BASE+"/events").json()[0]
    assert "join_url" not in public
    assert public["starts_at"] == "2027-01-10T22:00:00+00:00"
    assert member.get(BASE+"/events/first/access").json()["join_url"] == payload["join_url"]
    assert admin.put(BASE+"/admin/events/first", json={**payload, "published": False}).status_code == 200
    assert member.get(BASE+"/events/first/access").status_code == 404


def test_metrics_deduplicate_visits_and_measure_return(clients):
    _, member, _, admin, db = clients
    for _ in range(3):
        assert member.post(BASE+"/activity", json={"event": "visit"}).status_code == 200
    member.post(BASE+"/resources/speed-to-lead/download")
    member.post(BASE+"/resources/speed-to-lead/download")
    user_id = member.get("/api/auth/me").json()["user_id"]
    asyncio.run(db.community_activity.insert_one({"user_id": user_id, "event": "visit", "created_at": (datetime.now(timezone.utc)-timedelta(days=1)).isoformat()}))
    metrics = admin.get(BASE+"/admin/metrics").json()
    assert metrics["visit"] == 1
    assert metrics["download"] == 1
    assert metrics["returning"] == 1


def test_seed_preserves_editorial_changes(clients):
    _, _, _, _, db = clients
    asyncio.run(db.community_resources.update_one({"slug": "decisores"}, {"$set": {"title": "Título revisado", "published": False}}))
    asyncio.run(initialize_community(db))
    resource = asyncio.run(db.community_resources.find_one({"slug": "decisores"}))
    assert resource["title"] == "Título revisado"
    assert resource["published"] is False


def test_members_list_is_public_and_follow_requires_login(clients):
    anon, member, other, _, _ = clients
    member.post(BASE+"/join", json={})
    other.post(BASE+"/join", json={})
    listing = anon.get(BASE+"/members").json()
    assert listing["total"] == 2 and not listing["has_more"]
    assert all(set(m) == {"user_id", "name", "picture", "following", "is_me"} for m in listing["items"])
    other_id = next(m["user_id"] for m in listing["items"] if m["name"] == "Outro")
    me_id = next(m["user_id"] for m in listing["items"] if m["name"] == "Membro")
    assert anon.put(BASE+"/follows/"+other_id).status_code == 401
    assert member.put(BASE+"/follows/"+me_id).status_code == 400
    assert member.put(BASE+"/follows/desconhecido").status_code == 404
    for _ in range(2):
        assert member.put(BASE+"/follows/"+other_id).json() == {"following": True}
    mine = {m["name"]: m for m in member.get(BASE+"/members").json()["items"]}
    assert mine["Outro"]["following"] is True and mine["Membro"]["is_me"] is True
    assert other.get(BASE+"/members").json()["items"][0]["following"] is False
    assert member.delete(BASE+"/follows/"+other_id).json() == {"following": False}
    assert {m["name"]: m for m in member.get(BASE+"/members").json()["items"]}["Outro"]["following"] is False


def test_notification_prefs_and_reports(clients):
    anon, member, _, admin, _ = clients
    assert anon.get(BASE+"/notification-prefs").status_code == 401
    prefs = member.get(BASE+"/notification-prefs").json()["channels"]
    assert prefs["anuncios"] == "todas" and prefs["chat"] == "respostas" and len(prefs) == 6
    saved = member.put(BASE+"/notification-prefs", json={"channels": {"chat": "nenhuma"}}).json()["channels"]
    assert saved["chat"] == "nenhuma" and saved["anuncios"] == "todas"
    assert member.get(BASE+"/notification-prefs").json()["channels"]["chat"] == "nenhuma"
    assert member.put(BASE+"/notification-prefs", json={"channels": {"inexistente": "todas"}}).status_code == 422
    assert member.put(BASE+"/notification-prefs", json={"channels": {"chat": "sempre"}}).status_code == 422
    assert anon.post(BASE+"/reports", json={"reason": "spam"}).status_code == 401
    assert member.post(BASE+"/reports", json={"reason": "spam", "details": "Links repetidos no chat", "url": "/comunidade/chat"}).status_code == 201
    assert member.post(BASE+"/reports", json={"reason": "spam", "url": "https://externo.com"}).status_code == 422
    assert member.get(BASE+"/admin/reports").status_code == 403
    reports = admin.get(BASE+"/admin/reports").json()
    assert len(reports) == 1 and reports[0]["reason"] == "spam" and reports[0]["status"] == "aberto"


def test_seed_publishes_only_the_cnpj_flow_with_full_tutorial():
    from community import ResourceInput
    from community_seed import RESOURCES
    assert [r["slug"] for r in RESOURCES] == ["decisores"]
    item = ResourceInput(**RESOURCES[0])
    assert item.keyword == "CNPJ" and item.video_url.endswith("16x9.mp4") and item.video_vertical_url.endswith("9x16.mp4")
    # Cada passo abre com **Título.**, que vira o botão "Passo N" na página.
    assert len(item.steps) == 5 and all(s.startswith("**") and ".**" in s.split("\n")[0] for s in item.steps)
    tutorial = "\n".join(item.steps)
    # O passo do workflow traz o botão de download dentro dele.
    assert "[[baixar-json]]" in item.steps[2]
    # Nomes de credenciais e nós precisam bater com o export do fluxo (decisores.json).
    for needed in ["docker volume create n8n_data", "docker.n8n.io/n8nio/n8n", "localhost:5678", "Import from File", "x-api-key",
                   "`Authorization`", "Bearer SEU_TOKEN_APIFY", "Buscar CNPJ no Google 🔑", "Perfis no LinkedIn (Google) 🔑",
                   "Claude ranqueia 🔑", "**Entrada**", "Lista de decisores"]:
        assert needed in tutorial, needed


def test_admin_emails_are_promoted_without_touching_the_password(clients, monkeypatch):
    anon, member, _, _, database = clients
    monkeypatch.setattr(server, "ADMIN_EMAILS", {"dono@example.com", "membro@example.com"})
    owner = TestClient(server.app)
    created = owner.post("/api/auth/register", json={"name": "Dono", "email": "Dono@Example.com", "password": "senha-do-dono-123"})
    assert created.json()["role"] == "admin"
    assert owner.get(BASE+"/admin/resources").status_code == 200
    # Conta existente vira admin na próxima requisição, e a senha continua a mesma.
    assert member.get(BASE+"/admin/resources").status_code == 200
    again = TestClient(server.app)
    assert again.post("/api/auth/login", json={"email": "membro@example.com", "password": "test-password-123"}).json()["role"] == "admin"
    owner.close(); again.close()
