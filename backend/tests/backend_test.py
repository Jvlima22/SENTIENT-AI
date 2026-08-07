"""SENTIENT-AI backend regression tests.

Covers: auth (register/login/me), catalog listing/filters, category CRUD (admin gated),
product CRUD (admin gated), leads (free download flow), purchases tracking,
account downloads/purchases, admin metrics/leads, AI recommend + AI chat streaming.
"""
import os
import uuid
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://digital-vault-236.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@sentient-ai.com"
ADMIN_PASSWORD = "Admin@123"


# ---------------- fixtures ----------------
@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("role") == "admin"
    s.headers.update({"Authorization": f"Bearer {data['token']}"})
    return s


@pytest.fixture(scope="session")
def user_session():
    s = requests.Session()
    email = f"test_user_{uuid.uuid4().hex[:8]}@sentient-test.com"
    r = s.post(f"{API}/auth/register", json={"name": "TEST User", "email": email, "password": "Test@1234"}, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    s.headers.update({"Authorization": f"Bearer {data['token']}"})
    s.user_data = data  # type: ignore
    return s


# ---------------- Auth ----------------
class TestAuth:
    def test_admin_login_returns_admin_role_and_cookie(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "admin"
        assert d["email"] == ADMIN_EMAIL
        assert d["token"]
        # Cookie may or may not be sent back depending on Set-Cookie translation, check header presence
        assert "set-cookie" in {k.lower() for k in r.headers.keys()}

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_register_and_me(self, user_session):
        r = user_session.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "user"
        assert "password_hash" not in d

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401


# ---------------- Public catalog ----------------
class TestCatalog:
    def test_list_products(self):
        r = requests.get(f"{API}/products", timeout=30)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) > 0

    def test_list_products_free(self):
        r = requests.get(f"{API}/products?type=free", timeout=30)
        assert r.status_code == 200
        assert all(p["type"] == "free" for p in r.json())

    def test_list_products_paid(self):
        r = requests.get(f"{API}/products?type=paid", timeout=30)
        assert r.status_code == 200
        assert all(p["type"] == "paid" for p in r.json())

    def test_search(self):
        r = requests.get(f"{API}/products?search=IA", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_product_increments_views(self):
        prods = requests.get(f"{API}/products", timeout=30).json()
        assert prods
        pid = prods[0]["id"]
        v0 = prods[0].get("views", 0)
        r = requests.get(f"{API}/products/{pid}", timeout=30)
        assert r.status_code == 200
        # response returns pre-increment doc; re-fetch via list to verify persistence
        after = requests.get(f"{API}/products", timeout=30).json()
        v1 = next(p["views"] for p in after if p["id"] == pid)
        assert v1 >= v0 + 1

    def test_categories(self):
        r = requests.get(f"{API}/categories", timeout=30)
        assert r.status_code == 200 and len(r.json()) > 0

    def test_skills(self):
        r = requests.get(f"{API}/skills", timeout=30)
        assert r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0

    def test_skills_search(self):
        r = requests.get(f"{API}/skills?search=a", timeout=30)
        assert r.status_code == 200

    def test_community(self):
        r = requests.get(f"{API}/community", timeout=30)
        assert r.status_code == 200 and len(r.json()) > 0

    def test_faqs(self):
        r = requests.get(f"{API}/faqs", timeout=30)
        assert r.status_code == 200 and len(r.json()) > 0


# ---------------- Admin gating ----------------
class TestAdminGating:
    def test_product_create_unauth(self):
        r = requests.post(f"{API}/products", json={"title": "X"}, timeout=30)
        assert r.status_code == 401

    def test_product_create_user_forbidden(self, user_session):
        r = user_session.post(f"{API}/products", json={"title": "X"}, timeout=30)
        assert r.status_code == 403

    def test_admin_metrics_unauth(self):
        assert requests.get(f"{API}/admin/metrics", timeout=30).status_code == 401

    def test_admin_metrics_user_forbidden(self, user_session):
        assert user_session.get(f"{API}/admin/metrics", timeout=30).status_code == 403


# ---------------- Admin CRUD ----------------
class TestAdminCRUD:
    def test_category_crud(self, admin_session):
        payload = {"name": f"TEST_Cat_{uuid.uuid4().hex[:6]}", "icon": "star", "description": "test"}
        r = admin_session.post(f"{API}/categories", json=payload, timeout=30)
        assert r.status_code == 200
        cat = r.json()
        assert cat["name"] == payload["name"] and cat["id"]
        # update
        upd = {"name": cat["name"] + "_upd", "icon": "star", "description": "d"}
        r = admin_session.put(f"{API}/categories/{cat['id']}", json=upd, timeout=30)
        assert r.status_code == 200
        assert r.json()["name"].endswith("_upd")
        # delete
        r = admin_session.delete(f"{API}/categories/{cat['id']}", timeout=30)
        assert r.status_code == 200

    def test_product_crud_and_persistence(self, admin_session):
        cats = requests.get(f"{API}/categories", timeout=30).json()
        cid = cats[0]["id"]
        payload = {"title": f"TEST_Product_{uuid.uuid4().hex[:6]}", "short_description": "s",
                   "description": "d", "category_id": cid, "type": "free", "price": 0.0,
                   "thumbnail": "https://x/y.png", "download_url": "https://example.com/f.zip",
                   "tags": ["t"], "featured": False}
        r = admin_session.post(f"{API}/products", json=payload, timeout=30)
        assert r.status_code == 200
        p = r.json()
        pid = p["id"]
        assert p["category_name"] == cats[0]["name"]
        # get
        r = requests.get(f"{API}/products/{pid}", timeout=30)
        assert r.status_code == 200
        # update
        payload["title"] = payload["title"] + "_upd"
        r = admin_session.put(f"{API}/products/{pid}", json=payload, timeout=30)
        assert r.status_code == 200 and r.json()["title"].endswith("_upd")
        # delete
        r = admin_session.delete(f"{API}/products/{pid}", timeout=30)
        assert r.status_code == 200
        r = requests.get(f"{API}/products/{pid}", timeout=30)
        assert r.status_code == 404


# ---------------- Leads / Downloads / Purchases ----------------
class TestLeadsAndAccount:
    def test_free_lead_returns_download_url_and_records(self, admin_session, user_session):
        # ensure a known free product with download url
        cats = requests.get(f"{API}/categories", timeout=30).json()
        payload = {"title": f"TEST_Free_{uuid.uuid4().hex[:6]}", "short_description": "s",
                   "description": "d", "category_id": cats[0]["id"], "type": "free", "price": 0.0,
                   "thumbnail": "https://x/y.png", "download_url": "https://example.com/download.zip",
                   "tags": [], "featured": False}
        prod = admin_session.post(f"{API}/products", json=payload, timeout=30).json()
        pid = prod["id"]

        r = user_session.post(f"{API}/leads",
                              json={"product_id": pid, "name": "TEST", "email": "test@x.com", "phone": "1"},
                              timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["download_url"] == "https://example.com/download.zip"
        assert d["user_id"] is not None

        # verify downloads recorded
        dl = user_session.get(f"{API}/account/downloads", timeout=30)
        assert dl.status_code == 200
        assert any(x["product_id"] == pid for x in dl.json())

        # verify product downloads incremented
        p2 = requests.get(f"{API}/products/{pid}", timeout=30).json()
        assert p2.get("downloads", 0) >= 1

        admin_session.delete(f"{API}/products/{pid}", timeout=30)

    def test_purchase_track(self, admin_session, user_session):
        prods_paid = requests.get(f"{API}/products?type=paid", timeout=30).json()
        if not prods_paid:
            pytest.skip("no paid products")
        pid = prods_paid[0]["id"]
        r = user_session.post(f"{API}/purchases/track", json={"product_id": pid}, timeout=30)
        assert r.status_code == 200
        purchases = user_session.get(f"{API}/account/purchases", timeout=30).json()
        assert any(p["product_id"] == pid for p in purchases)

    def test_purchase_track_unauth(self):
        r = requests.post(f"{API}/purchases/track", json={"product_id": "x"}, timeout=30)
        assert r.status_code == 401


# ---------------- Admin metrics / leads ----------------
class TestAdminOps:
    def test_metrics(self, admin_session):
        r = admin_session.get(f"{API}/admin/metrics", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_products", "total_leads", "total_users", "free_products", "paid_products", "top_products"]:
            assert k in d

    def test_leads_list_and_update(self, admin_session):
        # create a lead via public endpoint first
        prods = requests.get(f"{API}/products", timeout=30).json()
        pid = prods[0]["id"]
        lead = requests.post(f"{API}/leads",
                             json={"product_id": pid, "name": "TEST_lead", "email": "l@x.com"},
                             timeout=30).json()
        lid = lead["id"]
        r = admin_session.get(f"{API}/admin/leads", timeout=30)
        assert r.status_code == 200
        assert any(x["id"] == lid for x in r.json())
        # update status
        r = admin_session.put(f"{API}/admin/leads/{lid}", json={"status": "contacted"}, timeout=30)
        assert r.status_code == 200
        # delete
        r = admin_session.delete(f"{API}/admin/leads/{lid}", timeout=30)
        assert r.status_code == 200


# ---------------- AI ----------------
class TestAI:
    def test_recommend(self):
        r = requests.post(f"{API}/ai/recommend", json={"query": "automação de marketing"}, timeout=90)
        assert r.status_code == 200
        d = r.json()
        assert "recommendations" in d and isinstance(d["recommendations"], list)
        assert len(d["recommendations"]) >= 1

    def test_chat_stream(self):
        with requests.post(f"{API}/ai/chat", json={"message": "Olá, o que é o SENTIENT-AI?"},
                           stream=True, timeout=120) as r:
            assert r.status_code == 200
            assert r.headers.get("X-Session-Id")
            assert "text/plain" in r.headers.get("content-type", "")
            chunks = []
            for c in r.iter_content(chunk_size=64):
                if c:
                    chunks.append(c)
                if sum(len(x) for x in chunks) > 20:
                    break
            body = b"".join(chunks)
            assert len(body) > 0
