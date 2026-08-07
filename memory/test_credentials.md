# Test Credentials — SENTIENT-AI

## Admin account (email/password auth)
- Email: `admin@sentient-ai.com`
- Password: `Admin@123`
- Role: admin
- Seeded automatically on backend startup (idempotent).

## Test user
- Create via registration form (`/cadastro`) or:
  - Email: `user@sentient-ai.com`
  - Password: `User@123`
  - Role: user (register through UI to create)

## Auth endpoints
- POST `/api/auth/register` — { name, email, password }
- POST `/api/auth/login` — { email, password }
- GET  `/api/auth/me`
- POST `/api/auth/logout`
- POST `/api/auth/google/session` — { session_id }  (Emergent Google OAuth)
- PUT  `/api/auth/profile` — { name, phone }

## Notes
- Auth uses JWT stored in httpOnly cookie `access_token` (7 days) + Bearer fallback.
- Google social login via Emergent managed OAuth (redirect to /conta).
- Admin-protected routes require role === "admin".
