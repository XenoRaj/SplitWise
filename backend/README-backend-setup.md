# Backend (Django) — Local setup

This document shows quick local development steps for the Django backend using a virtualenv and a Postgres database provided by Docker Compose.

Prereqs
- Docker & Docker Compose installed
- Python 3.11+ (use the project's Python you prefer)

Steps (PowerShell)

1. Copy environment file

```powershell
cd backend
copy .env.example .env
# Edit .env if you want to change secrets or DB connection
```

2. Start Postgres (docker-compose)

```powershell
# from backend/ folder
docker-compose up -d
```

3. Create and activate virtualenv, install requirements

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

4. Run migrations and start server

```powershell
# make sure .env exists and contains DATABASE_URL pointing to the docker db
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

5. Notes
- If you keep `DEBUG=True` in `.env`, Django will serve static files in dev only.
- To stop the DB: `docker-compose down` (from `backend/`).
