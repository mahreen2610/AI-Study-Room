# AI Study Room

AI Study Room is a premium, real-time web application that combines group study chats with a context-aware AI partner. Users can collaborate in study rooms, chat in real-time, upload PDF study materials, and query the AI partner using document context (Retrieval-Augmented Generation - RAG).

---

## 🚀 Key Features

* **Real-time Peer Chat**: Collaborative chat rooms for study groups synced in real-time using Supabase WebSockets.
* **Context-Aware AI Partner**: An interactive study assistant powered by Google Gemini 2.5 Flash.
* **Document RAG Ingestion**: Upload PDFs to a study room, parse and chunk the text, compute vector embeddings (`text-embedding-004`), and query the AI using your uploaded notes.
* **Premium UI/UX**: A dark-theme responsive design featuring glassmorphism, smooth animations, and optimized layout scrolling.
* **Cross-Browser Safe**: Optimized connection pooling prevents lock contentions on privacy-focused browsers like Brave and Chrome Incognito.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite), Axios, Lucide React, Custom CSS.
* **Backend**: Node.js, Express, Multer (file uploads), PDF-Parse (text extraction).
* **Database & Auth**: Supabase (PostgreSQL, `pgvector` extension, Storage Buckets, Auth, and Realtime Replication).
* **AI Engine**: Google Gemini API (`gemini-2.5-flash` for reasoning & `text-embedding-004` for vectors).

---

## ⚙️ Local Development Setup

### 1. Database Setup (Supabase Dashboard)
1. Create a project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the commands in `backend/supabase_schema.sql` to build the database tables, triggers, search functions, and RLS policies.
3. In the SQL Editor, run the following to enable real-time updates for chat messages and document statuses:
   ```sql
   alter publication supabase_realtime add table public.messages;
   alter publication supabase_realtime add table public.documents;
   ```
4. Navigate to **Storage** in the sidebar, create a new private bucket named exactly **`documents`**, and configure public/authenticated read/write RLS policies.

### 2. Configuration Setup
Create the `.env` configuration files locally (these are secured and will not be pushed to Git).

#### Backend Environment Variables
Create `backend/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
GEMINI_API_KEY=your-google-ai-studio-api-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

#### Frontend Environment Variables
Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-client-anon-key
VITE_API_URL=http://localhost:5000
```

### 3. Install Dependencies & Run

#### Run the Backend Server
```bash
cd backend
npm install
npm run dev
```
The server will start at `http://localhost:5000`.

#### Run the Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
The client app will open at `http://localhost:5173`.

---

## ☁️ Production Deployment

### 1. Deploy Frontend (Vercel)
1. Create an account on [Vercel](https://vercel.com).
2. Link your private GitHub repository.
3. Set the root directory to `frontend`.
4. Configure the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` pointing to your deployed backend URL).
5. Deploy!

### 2. Deploy Backend (Render)
1. Create an account on [Render](https://render.com).
2. Create a new **Web Service** linked to your repository.
3. Set the root directory to `backend`, the build command to `npm install`, and the start command to `node src/index.js`.
4. Configure your environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `PORT`, and `FRONTEND_URL` pointing to your Vercel client URL).
5. Deploy!
