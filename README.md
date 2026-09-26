# KindBytes

Surplus food to people. The rest, never to landfill. (SIH 2026, PS SIH26195)

KindBytes grades surplus food for safety, matches it to the nearest shelter or community kitchen,
dispatches a hygiene-checked volunteer, and segregates everything else at source into four streams
(people, animal feed, compost/biogas, recycling) with a QR audit trail and monthly compliance
certificates under the Solid Waste Management Rules, 2026.

## Stack

| Layer | Technology |
|---|---|
| Backend | **Django 5.2** + **Django REST Framework**: accounts, sessions, REST API, admin |
| Background jobs | **Celery 5** + **Redis**: the live dispatch network ticks every 2 s (Celery beat) |
| Database | **PostgreSQL 16** (SQLite for quick local development) |
| Frontend | Django templates, **Tailwind CSS 3** (theme + utilities), **Alpine.js 3** (auth card), **three.js** (3D India map) |
| Serving | **Gunicorn** + **WhiteNoise** (compressed, cache-busted static files) |
| Containers | **Docker** multi-stage build (Node builds CSS/JS, slim Python runtime, non-root UID 10001) |
| Orchestration | **Kubernetes**: web Deployment with HPA (2–6 pods), PodDisruptionBudget, Ingress, Celery worker + beat, Postgres StatefulSet, Redis |
| CI/CD | GitHub Actions: tests on PostgreSQL, then image build and push to GHCR |

```
 browser ──HTTP──▶ Ingress ──▶ web (Gunicorn + Django, 2–6 pods, HPA)
   │  polls /api/state/ every 2 s            │
   │  Alpine.js · Tailwind · three.js        ├──▶ PostgreSQL (StatefulSet)
                                              │
 Celery beat ──(every 2 s)──▶ Redis ──▶ Celery worker ──▶ core.sim.tick()
```

## Project layout

```
kindbytes/        Django project: settings (env-driven), urls, celery app
accounts/         custom User model, sign-up rules (FSSAI, NGO Darpan…), auth endpoints
core/
  engine.py       pure rules: safety score, four-stream split, match score (unit-tested)
  sim.py          batch lifecycle + live network: seed, spawn, dispatch, pickup, deliver, expiry
  api.py          REST endpoints (DRF)          serializers.py  JSON for the frontend
  tasks.py        Celery task                   tests.py        17 tests
templates/        base.html, index.html, partials/ (auth_card.html is the Alpine.js component)
frontend/src/     css/app.css (Tailwind entry), css/legacy.css (component styles), js/app.js, js/auth.js
k8s/              base/ (all manifests) and overlays/local/ (kind/minikube)
```

## Run it in VS Code (no Docker)

Needs Python 3.12+ and Node 20+. Open this folder in VS Code and accept the recommended extensions.

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
npm install
npm run build                   # Tailwind CSS + JS bundles into static/
python manage.py migrate
python manage.py seed_kindbytes
python manage.py runserver      # http://127.0.0.1:8000
```

Or press **F5** and pick "KindBytes: Django runserver". Without Redis/Celery the API advances the
network itself on each request (`KB_LAZY_TICK=1`, the default), so everything works locally.
While editing styles run **Terminal → Run Task → Tailwind: watch CSS**.

Admin panel: `python manage.py createsuperuser`, then open `/admin/`.

## Run the full stack with Docker

```bash
docker compose up --build       # http://localhost:8000
```

Starts PostgreSQL, Redis, a one-off migrate+seed job, the web app (Gunicorn), a Celery worker and Celery beat.

## Run on Kubernetes (kind)

```bash
kind create cluster --name kindbytes
docker build -t kindbytes:1.0.0 .
kind load docker-image kindbytes:1.0.0 --name kindbytes
kubectl apply -k k8s/overlays/local
kubectl -n kindbytes rollout status deploy/kindbytes-web
kubectl -n kindbytes port-forward svc/kindbytes-web 8000:80     # http://localhost:8000
```

minikube: run `eval $(minikube docker-env)` before `docker build`, then the same `kubectl` commands.
The HPA needs metrics-server (`minikube addons enable metrics-server`).
In the cloud, push to `main` (CI publishes the image to GHCR), set real values in `k8s/base/secret.yaml`
(or a sealed secret), point DNS at the ingress and `kubectl apply -k k8s/base`.

## API

All endpoints are JSON. Session authentication with CSRF protection.

| Method | Path | Who | Does |
|---|---|---|---|
| GET | `/api/state/` | anyone | Everything the dashboards render (polled every 2 s) |
| POST | `/api/auth/signup/` · `login/` · `demo/` · `logout/` | anyone | Accounts and sessions |
| POST | `/api/batches/` | donors | List surplus; graded server-side |
| POST | `/api/batches/<code>/assign/` · `unsafe/` · `advance/` | signed in | Dispatch actions |
| POST | `/api/batches/<code>/accept/` · `pickup/` · `deliver/` | volunteer / receiver | Pickup with hygiene gate and probe reading |
| POST | `/api/reports/` · `/api/reports/<code>/status/` | citizens / municipal body | Waste hotspot reports |
| POST | `/api/me/capacity/` | NGOs | Update intake capacity |
| POST | `/api/sim/` | signed in | Surge mode, auto-dispatch switch |
| POST | `/api/bwg/<id>/notice/` | municipal body | Notice to a bulk waste generator |
| GET | `/healthz`, `/readyz` | probes | Liveness and readiness (DB) |

## Tests

```bash
python manage.py test           # 17 tests: engine rules + API flows (runs on SQLite or PostgreSQL)
```

## Demo accounts

On the login card: Restaurant (Hotel Meghdoot), NGO (Annadaan Kitchen), Volunteer (Priya Sharma),
and a municipal body. Live network data is simulated.
