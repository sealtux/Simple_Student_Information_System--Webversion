# Student Information System

This is a full-stack web app for managing students, programs, and colleges.

- **Backend:** Flask (Python) + PostgreSQL
- **Frontend:** React (Vite)
- **Auth / Data:** Custom API + Supabase (for some frontend data access)
- **Dev Tools:** Pipenv, Node.js, npm

---


**Backend**

- Python 3 (via pyenv / Pipenv)
- Flask 3
- Flask-Cors
- psycopg2-binary (PostgreSQL)
- python-dotenv

**Frontend**

- React
- Vite
- @supabase/supabase-js

**Database**

- PostgreSQL (local DB: `informationsystem`)

---

## 📂 Project Structure

```text
mainfolder/
├─ app.py                 # optional runner for Flask
├─ .flaskenv              # Flask config (FLASK_APP, FLASK_ENV, etc.)
├─ requirements.txt       # backend dependencies (for pip)
├─ Pipfile / Pipfile.lock # backend dependencies (for pipenv)
├─ README.md

├─ app/                   # Flask backend package
│  ├─ __init__.py         # creates Flask app, registers blueprints
│  ├─ config.py           # backend configuration
│  ├─ controllers/
│  │  ├─ student.py       # /students endpoints
│  │  ├─ program.py       # /programs endpoints
│  │  ├─ college.py       # /colleges endpoints
│  │  ├─ login.py         # /login endpoints
│  │  └─ signup.py        # /signup endpoints
│  ├─ templates/          # (optional) Jinja templates if needed
│  └─ static/             # (optional) static files

└─ app/views/             # React frontend (Vite project root)
   ├─ package.json
   ├─ vite.config.* 
   ├─ index.html
   ├─ .env.local          # Vite env (Supabase keys)
   ├─ node_modules/       # (ignored in git)
   └─ src/
      ├─ main.jsx         # React entry
      ├─ App.jsx
      ├─ pages/           # full pages (students, colleges, login, etc.)
      ├─ components/      # reusable UI components
      ├─ services/        # supabase client, API helpers
      └─ assets/          # images, CSS, etc.
      └─ routes           # Routes 