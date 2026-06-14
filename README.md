# AI Blog Platform

An AI-powered blogging platform where users generate, write, edit, and share blogs with AI assistance — featuring dual auth (self-hosted JWT + Firebase), multi-level caching, rate limiting, and push notifications.

---

## Features

### Blogging
- **AI Blog Generation** — Generate full blog posts from a topic via Groq LLM + RAG (web search context)
- **Manual Blog Editor** — Markdown editor (CodeMirror 6) with toolbar, AI sentence suggestions, tag management
- **Blog Management** — Publish drafts, edit, delete, set cover images
- **Search** — Search blogs by title, content, or tags with pagination
- **Load More** — Paginated blog feed with "Load More" button

### Social
- **User Profiles** — Custom username, display name, bio, avatar URL
- **Follow System** — Follow/unfollow users with notifications
- **Likes** — Like/unlike blogs with real-time count updates
- **Comments** — Comment on blogs with delete capability

### AI-Powered Tools
- **AI Suggestions** — Next-sentence suggestions while typing (Tab to accept)
- **SEO Analysis** — Score, meta description, keywords, readability, improvement tips
- **Blog Summarization** — AI-generated TLDR summarization
- **Auto Tagging** — AI-generated tags from content

### Authentication
- **Dual Auth** — Self-hosted JWT (default) or Firebase Auth
- **Registration** — Email/password with server + client validation
- **Cross-tab Sync** — Login/logout syncs across browser tabs
- **Token Expiry Detection** — Auto-logout on expired JWT

### Notifications
- **In-app Notifications** — Bell icon with dropdown for likes, comments, follows, new blogs
- **FCM Push Notifications** — Optional Firebase Cloud Messaging for mobile push
- **Auto-mark Read** — Notifications auto-mark as read on dropdown open

### Performance & Reliability
- **Multi-level Caching** — In-memory → Redis → Firestore → Database
- **Cache Invalidation** — Automatic cache busting on create/update/delete
- **Rate Limiting** — Auth (5/min), blog generation (30/min), upload (10/min)

### Security
- **Input Validation** — Email, password strength, username, title, content, upload MIME type + size
- **JWT Hardening** — jti claim, iat claim, configurable expiry, no default secret
- **Upload Safety** — MIME validation, max 5MB, path traversal prevention
- **Error Handling** — Global exception handlers, structured logging with request IDs
- **Axios Interceptors** — Auto-redirect to login on 401, error logging for 429/500+

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **Frontend** | React 19, Redux Toolkit, React Router 7 |
| **Database** | SQLite (dev) / PostgreSQL (prod) via SQLAlchemy |
| **AI / LLM** | Groq API (llama-3.1-8b / llama-3.3-70b) |
| **Cache** | In-memory + Redis + optional Firestore |
| **Auth** | Self-hosted JWT (python-jose) or Firebase Auth |
| **Push** | Firebase Cloud Messaging (optional) |
| **Markdown** | CodeMirror 6 |
| **3D Graphics** | OGL (WebGL orb animation) |

---

## Project Structure

```
ai-blog-platform/
├── backend/
│   ├── main.py                  # FastAPI app + all routes
│   ├── models.py                # SQLAlchemy ORM models
│   ├── database.py              # DB engine + session
│   ├── crud.py                  # CRUD operations
│   ├── auth.py                  # JWT + password hashing
│   ├── firebase_auth.py         # Firebase dual auth
│   ├── engine.py                # BlogEngine (Groq LLM)
│   ├── structured_blog_chain.py # AI blog generation pipeline
│   ├── rag.py                   # Web search + RAG context
│   ├── cache.py                 # Multi-level cache
│   ├── firestore_cache.py       # Firestore cache tier
│   ├── fcm.py                   # Push notifications
│   ├── validators.py            # Input validation
│   ├── ratelimit.py             # Rate limiter
│   ├── logger.py                # Structured logging
│   └── .env                     # Environment variables
├── frontend/
│   └── src/
│       ├── App.js               # Root with routing
│       ├── pages/               # Route pages
│       ├── components/          # Reusable components
│       ├── api/blogApi.js       # Axios API client
│       ├── services/auth.js     # Auth service
│       ├── features/            # Redux slices
│       ├── firebase/            # Firebase client SDK
│       ├── context/             # React contexts
│       └── hooks/               # Custom hooks
├── PROGRESS.md                  # Development tracker
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.11
- Node.js 18+
- Groq API key ([console.groq.com](https://console.groq.com))

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt

# Create .env with your keys:
# GROQ_API_KEY=gsk_...
# JWT_SECRET_KEY=<random-64-char-string>

uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env:
# REACT_APP_API_URL=http://127.0.0.1:8000

npm start
```

Open `http://localhost:3000`.

---

## Environment Variables

### Backend

| Variable | Required | Default | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | — | Groq Cloud API key |
| `JWT_SECRET_KEY` | **Yes** | — | 64+ char random string |
| `DATABASE_URL` | No | `sqlite:///./blogs.db` | PostgreSQL in production |
| `REDIS_URL` | No | `redis://localhost:6379` | Falls back to in-memory |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | No | — | Path to Firebase admin JSON |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | No | — | Inline Firebase admin JSON |
| `JWT_ALGORITHM` | No | `HS256` | |
| `JWT_EXPIRATION_HOURS` | No | `72` | |

### Frontend

| Variable | Required | Default | Notes |
|---|---|---|---|
| `REACT_APP_API_URL` | No | `http://127.0.0.1:8000` | Backend URL |
| `REACT_APP_FIREBASE_CONFIG` | No | — | JSON string for Firebase SDK |

---

## Deployment

### Backend (Render / Heroku)
Uses `Procfile` and `runtime.txt`. Set environment variables in your hosting dashboard.

### Frontend (Vercel)
```bash
cd frontend
npm run build
```
Deploy the `build/` directory. CORS origins are preconfigured for Vercel deployments.

---

## Limitations & Warnings

### Things the website **cannot** do (yet)
- **No blog content update endpoint** — blogs cannot be edited after creation (except cover image). Delete + recreate.
- **No social login** — Google/Facebook login buttons are placeholders; only email/password works out-of-the-box.
- **No password reset** — no "forgot password" flow.
- **No admin panel** — no moderation tools, no user management UI.
- **No pagination on profile blogs** — public profile blog list uses the backend's pagination params but the frontend loads all at once.
- **No unsplash/stock image integration** — cover images must be pasted as URLs.
- **No automated tests** — no backend test suite (unit/integration).

### Known issues & cautions
- **bcrypt < 5.0 pinned** — `passlib[bcrypt]` is incompatible with bcrypt 5.x. If bcrypt upgrades, password verification breaks.
- **SQLite not for production** — defaults to SQLite. Use PostgreSQL (`DATABASE_URL`) for any real deployment. SQLite doesn't handle concurrent writes.
- **Redis optional, but...** — without Redis, cache is in-memory only (per-process, lost on restart). With multiple server workers, each has its own cache.
- **Firebase optional, but...** — push notifications, Firestore cache, and Firebase Auth are only active if you provide service account credentials.
- **Device tokens not persisted** — FCM device tokens are stored in memory and lost on server restart.
- **Rate limits are per-process** — rate limiter is in-memory; resets on restart and doesn't share across workers.
- **Delete endpoint lacks auth** — `DELETE /blogs/{blog_id}` does not verify the caller owns the blog (anyone can delete any blog).
- **CORS origins hardcoded** — frontend domains must be added to `main.py` for cross-origin requests.
- **No rate limiting on general endpoints** — only auth, generate, and upload are throttled.

---

## License

MIT
