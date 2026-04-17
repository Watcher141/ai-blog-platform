# 🤖 AI Blog Platform

A full-stack AI-powered blog platform built with **React** (frontend) and **FastAPI** (backend), featuring a rich code editor, 3D UI elements, Firebase integration, and AI-generated content powered by **Groq**.

---

## 🧱 Tech Stack

### Frontend

- **React 19** with Redux Toolkit for state management
- **React Router v7** for navigation
- **CodeMirror 6** – Markdown code editor
- **Three.js / React Three Fiber / Postprocessing** – 3D visuals
- **Firebase** – Auth & Firestore database
- **Axios** – HTTP client
- **React Markdown** – Render blog content

### Backend

- **FastAPI** (Python)
- **Groq API** – LLM for AI blog generation (`GROQ_API_KEY`)

---

## 📁 Project Structure

```bash
ai-blog-platform/
│
├── backend/                      # FastAPI backend
│   ├── __pycache__/
│   ├── venv/                     # Virtual environment
│   ├── .env                      # Environment variables (Groq API key)
│   ├── .prettierrc
│   ├── blogs.db                  # SQLite database
│   ├── cache.py                  # Caching layer for faster responses
│   ├── crud.py                   # Database CRUD operations
│   ├── database.py               # Database connection setup
│   ├── engine.py                 # Core LLM interaction (Groq API)
│   ├── firebase_auth.py          # Firebase authentication logic
│   ├── firebase_service_account.json  # Firebase credentials
│   ├── init_db.py                # Database initialization script
│   ├── main.py                   # FastAPI entry point
│   ├── models.py                 # Database models/schema
│   ├── Procfile                  # Deployment config (Heroku/Render)
│   ├── rag.py                    # Retrieval-Augmented Generation (RAG)
│   ├── structured_blog_chain.py  # Blog generation pipeline
│   ├── requirements.txt          # Python dependencies
│   └── runtime.txt               # Python runtime version
│
├── frontend/                     # React frontend
│   ├── node_modules/
│   ├── public/
│   ├── src/                      # Main React source code
│   ├── .env                      # Firebase configuration
│   ├── .env.production
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
│
├── .gitattributes
├── .gitignore
└── README.md                     # Root project documentation
```

---

## 🧠 Key Highlights

- **RAG Pipeline (`rag.py`)**  
  Enhances blog generation by retrieving relevant web/context data before passing it to the LLM.

- **Structured Generation (`structured_blog_chain.py`)**  
  Ensures blogs are generated in a clean, section-wise format instead of raw text.

- **LLM Engine (`engine.py`)**  
  Handles interaction with the Groq API for fast AI content generation.

- **Database Layer (`models.py`, `crud.py`, `database.py`)**  
  Manages blog storage and retrieval using SQLite.

- **Authentication (`firebase_auth.py`)**  
  Secure user authentication via Firebase.

## ⚙️ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.10+
- [pip](https://pip.pypa.io/)
- A [Groq API key](https://console.groq.com/)
- A [Firebase project](https://console.firebase.google.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Watcher141/ai-blog-platform.git
cd ai-blog-platform
```

---

### 2. Backend Setup (FastAPI)

```bash
cd backend
```

#### Create and activate a virtual environment

```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

#### Install dependencies

```bash
pip install -r requirements.txt
```

#### Set up environment variables

Create a `.env` file inside the `backend/` folder:

```env
GROQ_API_KEY=your_groq_api_key_here
```

#### Run the backend server

```bash
uvicorn main:app --reload
```

The API will be available at: `http://localhost:8000`

> **API Docs:** Visit `http://localhost:8000/docs` for the auto-generated Swagger UI.

---

### 3. Frontend Setup (React)

```bash
cd frontend
```

#### Install dependencies

```bash
npm install
```

#### Set up Firebase

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication** and **Firestore**
4. Copy your Firebase config

Create a `.env` file inside the `frontend/` folder:

```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

#### Configure the backend URL (optional)

If your backend runs on a port other than `8000`, update the Axios base URL in your source code accordingly.

#### Start the development server

```bash
npm start
```

The app will open at: `http://localhost:3000`

---

## 🔑 Environment Variables Summary

### Backend (`backend/.env`)

| Variable       | Description                  |
| -------------- | ---------------------------- |
| `GROQ_API_KEY` | Your API key from Groq Cloud |

### Frontend (`frontend/.env`)

| Variable                                 | Description                  |
| ---------------------------------------- | ---------------------------- |
| `REACT_APP_FIREBASE_API_KEY`             | Firebase API Key             |
| `REACT_APP_FIREBASE_AUTH_DOMAIN`         | Firebase Auth Domain         |
| `REACT_APP_FIREBASE_PROJECT_ID`          | Firebase Project ID          |
| `REACT_APP_FIREBASE_STORAGE_BUCKET`      | Firebase Storage Bucket      |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `REACT_APP_FIREBASE_APP_ID`              | Firebase App ID              |

---

## 📦 Available Scripts (Frontend)

Inside the `frontend/` directory:

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `npm start`     | Start the development server       |
| `npm run build` | Build the app for production       |
| `npm test`      | Run tests                          |
| `npm run eject` | Eject from Create React App config |

---

## 🛠️ Common Issues

**`Module not found` errors on npm install**
→ Delete `node_modules/` and `package-lock.json`, then run `npm install` again.

**Backend not connecting to frontend**
→ Make sure CORS is enabled in your FastAPI app and both servers are running.

**Groq API errors**
→ Double-check your `GROQ_API_KEY` is valid and has not exceeded its rate limit.

**Firebase permission errors**
→ Check your Firestore security rules in the Firebase Console.

---

## 📄 License

This project is open-source. See the [LICENSE](LICENSE) file for details.
