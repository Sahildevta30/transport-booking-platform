# API

Route Handlers under `app/api/`. Only `GET /api/health` exists in
Phase 1 (basic liveness check, no dependencies touched).

Phase 2+ will add booking, payment webhook, and admin API routes here.
Each new route should document its method, auth requirement, and
request/response shape in this folder as it's added.
