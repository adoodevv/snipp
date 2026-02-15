# Snipp

**Real-time collaborative code snippets with AI-powered search**

Snipp is a modern code snippet manager that lets you create, share, and collaborate on code in real time. Use AI to search across your snippets, get explanations, and generate new code—all in one place.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## Features

- **Code snippets** — Create and manage snippets with syntax highlighting (Monaco Editor)
- **Version history** — Every save creates a new version with optional change descriptions
- **Real-time collaboration** — Public snippets support live collaborative editing with Supabase Realtime
- **Presence & cursors** — See who else is editing and where their cursors are
- **Share with tokens** — Share public snippets via a link; collaborators get edit access with a token
- **AI chat** — Ask questions about your snippets, find code by description, explain code, generate snippets (powered by Google Gemini)
- **Conversation history** — AI chat conversations are saved and can be resumed
- **Auth** — Sign up / sign in with Supabase Auth (email)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (PostgreSQL, Auth, Realtime)
- **Editor:** Monaco Editor
- **AI:** Google Gemini API
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (for Gemini)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/snipp.git
cd snipp
npm install
```

### 2. Database setup (Supabase)

Run the migrations in your Supabase project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Run the contents of `supabase/migrations/00001_create_snippets.sql`
3. Run the contents of `supabase/migrations/00002_create_ai_conversations.sql`

**Realtime (Broadcast & Presence)** is used for collaborative editing. It’s enabled by default in Supabase—no extra setup needed.

### 3. Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Service role key (for collaborative save) |
| `GEMINI_API_KEY` | Yes** | Google Gemini API key (for AI chat) |

\* Required for saving collaborative edits on public snippets.  
\** Required for AI chat. Without it, the app works but AI features are disabled.

- **Supabase keys:** Dashboard → Project Settings → API Keys  
- **Gemini key:** [Google AI Studio](https://aistudio.google.com/apikey)

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project structure

```
snipp/
├── app/
│   ├── api/
│   │   ├── ai/           # AI chat, ask-snippet, conversations
│   │   └── snippet/      # Save, regenerate token
│   ├── auth/             # Login, signup, callback
│   ├── snippet/[id]/     # View/edit snippet
│   ├── new/              # Create snippet
│   └── page.tsx          # Dashboard (snippets list)
├── components/
│   ├── collaborative-editor.tsx   # Monaco + Supabase Realtime
│   ├── chat-panel.tsx             # AI chat UI
│   ├── snippet-content.tsx        # Snippet view/edit
│   └── ...
├── lib/
│   └── db.ts             # Database helpers
├── supabase/
│   └── migrations/       # SQL migrations
└── utils/
    └── supabase/         # Supabase client (server, client, admin)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Deploy

The app can be deployed to [Vercel](https://vercel.com) or any Node.js host. Add the same environment variables in your deployment platform.
