<div align="center">

# ✦ Blog Gen ✦

### AI-Powered Blogging Platform

[![Live Site](https://img.shields.io/badge/LIVE-ai--blog--frontend--pp7d.onrender.com-00C853?style=for-the-badge&logo=render&logoColor=white)](https://ai-blog-frontend-pp7d.onrender.com)
[![Backend API](https://img.shields.io/badge/API-ai--blog--backend--ytfj.onrender.com-00C853?style=for-the-badge&logo=fastapi&logoColor=white)](https://ai-blog-backend-ytfj.onrender.com/health)

[![Python](https://img.shields.io/badge/Python_3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)](https://react.dev)
[![Redux](https://img.shields.io/badge/Redux_Toolkit-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Groq](https://img.shields.io/badge/Groq_LLM-F55036?logo=groq&logoColor=white)](https://groq.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?logo=sqlalchemy&logoColor=white)](https://sqlalchemy.org)
[![Render](https://img.shields.io/badge/Deployed_on_Render-46E3B7?logo=render&logoColor=white)](https://render.com)

---

**Generate, write, edit, and share blogs with AI assistance.**  
Featuring dual auth, multi-level caching, push notifications, and real-time AI suggestions.

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📝 Blogging
- **AI Generation** — Full blog posts from a topic via Groq LLM + web search context
- **Markdown Editor** — CodeMirror 6 with toolbar, AI sentence suggestions (Tab to accept)
- **Blog Management** — Publish drafts, set cover images, delete
- **Search** — By title, content, or tags with instant results
- **Load More** — Paginated feed with progressive loading

### 👥 Social
- **User Profiles** — Custom username, bio, avatar URL
- **Follow System** — Follow/unfollow with notifications
- **Likes** — Heart toggle with real-time count
- **Comments** — Threaded with delete capability

</td>
<td width="50%">

### 🤖 AI Tools
- **AI Suggestions** — Next-sentence completion while typing
- **SEO Analysis** — Score, meta description, keywords, readability tips
- **TLDR Summarization** — One-click blog summarization
- **Auto Tagging** — AI-generated tags from content

### 🔐 Auth & Security
- **Dual Auth** — Self-hosted JWT or Firebase Auth
- **Validation** — Email format, password strength, input sanitization
- **Rate Limiting** — Auth (5/min), generate (30/min), upload (10/min)
- **JWT Hardening** — jti/iat claims, configurable expiry

### ⚡ Performance
- **Multi-level Cache** — Memory → Redis → Firestore → Database
- **Auto Invalidation** — Cache busts on create/update/delete

</td>
</tr>
</table>

---

## 🛠 Tech Stack

<div align="center">

### Backend
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-1B8C9E?style=flat-square&logo=uvicorn&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_LLM-F55036?style=flat-square&logo=groq&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Redux](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=flat-square&logo=redux&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router_7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)
![CodeMirror](https://img.shields.io/badge/CodeMirror_6-D70000?style=flat-square&logo=codemirror&logoColor=white)
![OGL](https://img.shields.io/badge/OGL_WebGL-5586A4?style=flat-square&logo=webgl&logoColor=white)

### Services
![Firebase](https://img.shields.io/badge/Firebase_Auth_&_FCM-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Firestore_Cache-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Upstash](https://img.shields.io/badge/Upstash_Redis-00E9A3?style=flat-square&logo=upstash&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=white)

</div>

---

## 📁 Project Structure

```
ai-blog-platform/
├── backend/
│   ├── main.py                  # FastAPI app + 30+ routes
│   ├── models.py                # 7 SQLAlchemy ORM models
│   ├── crud.py                  # Full CRUD operations
│   ├── auth.py                  # JWT creation/verification
│   ├── firebase_auth.py         # Firebase dual auth
│   ├── engine.py                # BlogEngine (Groq LLM)
│   ├── structured_blog_chain.py # AI blog generation pipeline
│   ├── rag.py                   # Web search + RAG context
│   ├── cache.py                 # Multi-level caching layer
│   ├── firestore_cache.py       # Firestore cache tier
│   ├── fcm.py                   # Push notifications
│   ├── validators.py            # Input validation
│   ├── ratelimit.py             # In-memory rate limiter
│   └── logger.py                # Structured logging
├── frontend/
│   └── src/
│       ├── App.js               # Root with routing
│       ├── pages/               # 7 route pages
│       ├── components/          # 15 reusable components
│       ├── api/blogApi.js       # Axios API client
│       ├── services/auth.js     # Auth service
│       ├── features/            # Redux slices
│       ├── firebase/            # Firebase client SDK
│       └── context/             # Toast context
└── README.md
```

---

## 🚀 Quick Start

```bash
# Backend
cd backend
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Edit .env with your keys
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
# Edit .env with REACT_APP_API_URL
npm start
```

---

## 🌐 Environment Variables

<details>
<summary><b>Backend</b></summary>

| Variable | Required | Default | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | — | Groq Cloud API key |
| `JWT_SECRET_KEY` | ✅ Yes | — | 64+ char random string |
| `DATABASE_URL` | ❌ No | `sqlite:///./blogs.db` | PostgreSQL in production |
| `REDIS_URL` | ❌ No | `redis://localhost:6379` | Falls back to in-memory |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | ❌ No | — | Path to Firebase admin JSON |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | ❌ No | — | Inline Firebase admin JSON |
| `JWT_ALGORITHM` | ❌ No | `HS256` | |
| `JWT_EXPIRATION_HOURS` | ❌ No | `72` | |

</details>

<details>
<summary><b>Frontend</b></summary>

| Variable | Required | Default | Notes |
|---|---|---|---|
| `REACT_APP_API_URL` | ❌ No | `http://127.0.0.1:8000` | Backend URL |
| `REACT_APP_FIREBASE_CONFIG` | ❌ No | — | JSON for Firebase SDK |

</details>

---

## 🧠 API Endpoints

| Route | Description |
|---|---|
| `GET /health` | Database & service health check |
| `POST /auth/register` | Create account |
| `POST /auth/login` | Login, returns JWT |
| `GET /blogs` | List blogs (paginated) |
| `GET /blogs/search?q=` | Search blogs |
| `POST /blogs/generate?topic=` | AI blog generation |
| `POST /blogs/manual` | Create blog manually |
| `POST /blogs/{id}/publish` | Publish draft |
| `POST /blogs/{id}/like` | Toggle like |
| `POST /blogs/{id}/comments` | Add comment |
| `POST /users/{uid}/follow` | Toggle follow |
| `GET /u/{username}` | Public profile |
| `POST /suggest` | AI sentence suggestion |
| `POST /blogs/seo` | SEO analysis |
| `POST /blogs/summarize` | TLDR summary |
| `POST /users/me/device-token` | Register FCM token |

---

## ⚠️ Limitations

<details>
<summary><b>Things it cannot do (yet)</b></summary>

- No blog content update endpoint (delete + recreate)
- No social login (Google/Facebook are placeholders)
- No password reset flow
- No admin panel or moderation tools
- No Unsplash/stock image integration
- No automated test suite

</details>

<details>
<summary><b>Known cautions</b></summary>

- `bcrypt < 5.0` pinned — passlib incompatibility
- SQLite in dev, PostgreSQL recommended for production
- Redis optional — falls back to in-memory cache
- Firebase optional — falls back to self-hosted JWT
- FCM device tokens stored in memory only
- Rate limiter is in-memory (resets on restart)
- `DELETE /blogs/{id}` lacks auth check
- CORS origins hardcoded in `main.py`

</details>

---

<div align="center">

**Built with** 🩶 **by [Watcher141](https://github.com/Watcher141)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>
