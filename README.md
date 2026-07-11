# Micro-Donations Platform

A web app for making small, mobile-money-native donations to community causes across East Africa. Donors pay via M-Pesa STK push — one-off or recurring — and can track exactly where their money goes.

## Overview

Recipients create a cause with a funding goal, category, and country. Donors browse or search for causes and give any amount, paid straight from their phone via M-Pesa. Every cause page shows real-time progress, recent donations, and a comment thread. Donors earn reward points on each donation, redeemable from an admin-managed catalog, and can download a PDF receipt for any completed donation.

## Features

- Cause creation, browsing, search, and filtering by category/country
- M-Pesa donations via STK push — one-off or recurring (weekly/monthly)
- Comments on cause pages
- Reward points earned per donation, redeemable for admin-managed rewards
- Downloadable PDF receipts for completed donations
- Admin moderation: edit or remove any cause, manage the rewards catalog
- Admin user management: promote or demote other users to admin
- JWT-based authentication

## Tech Stack

**Backend:** Flask, SQLAlchemy, Alembic migrations, Flask-JWT-Extended, ReportLab (receipts), M-Pesa Daraja API.

**Frontend:** React, React Router, Tailwind CSS, Formik + Yup, Framer Motion.

## Project Structure

```
server/
  app.py              # Flask app factory, blueprint registration
  models.py            # SQLAlchemy models
  config.py             # M-Pesa configuration
  routes/                # One blueprint per resource (causes, donations, rewards, admin, ...)
  services/              # M-Pesa client, PDF receipt generation
  jobs/                  # Standalone script that charges due recurring donations
  migrations/             # Alembic migrations
  tests/                  # pytest suite
  seed.py                 # Resets and seeds demo data

client/
  src/
    pages/
      public/               # Home, Causes, CauseDetail, Login, Register, NotFound
      dashboard/            # Dashboard, MyCauses, MyDonations, Profile, Rewards, CreateCause, EditCause
      admin/                # AdminCauses, AdminUsers
    components/            # Shared layout (NavBar, Sidebar, ...) and components/ui/ primitives
    services/               # One API client module per backend resource
    context/                 # Auth state
```

## Getting Started

Use Python 3.10–3.12. Python 3.14 breaks a couple of pinned dependencies (`psycopg2-binary`, `greenlet`) that don't yet have wheels for it.

### Backend

From the repo root — the app always imports itself as `server.*`, so commands must run from here, not from inside `server/`.

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r server/requirements-dev.txt

cp .env.example .env   # fill in SECRET_KEY at minimum

export FLASK_APP=server.app:create_app
flask db upgrade
python -m server.seed   # optional: demo causes, donations, rewards, and a donor/recipient/admin account
flask run --port 5050
```

Port 5050, not 5000 — macOS's AirPlay Receiver squats on port 5000 by default and will silently swallow requests instead of Flask.

### Frontend

```sh
cd client
npm install
echo "REACT_APP_API_URL=http://localhost:5050/api" > .env.local
npm start
```

### Tests

```sh
python -m pytest server/tests -v
```

### Creating the first admin

Registration never accepts a role from the client, so every new account starts as a regular user. Promote one manually:

```sh
python -c "
from server.app import create_app
from server.models import db, User
app = create_app()
with app.app_context():
    user = User.query.filter_by(email='you@example.com').first()
    user.role = 'admin'
    db.session.commit()
"
```

Once promoted, that admin can promote or demote anyone else from Manage Users in the dashboard.

## Deployment

`Procfile` runs migrations and starts gunicorn from the repo root. Recurring donations are charged by a separate script, not the web process — schedule `python -m server.jobs.run_recurring_donations` to run daily via a platform cron job (e.g. a Render Cron Job), with the same environment variables as the web service.

See `.env.example` for the full list of required and optional environment variables, including the M-Pesa Daraja sandbox credentials and the callback secret used to verify M-Pesa's webhook.

## License

MIT — see [LICENSE](LICENSE).

## Author

**Benjamin Mweri Baya**
b3njaminbaya@gmail.com
