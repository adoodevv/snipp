# Snipp

**Real-time collaborative code snippets with AI-powered search**

Snipp is a modern code snippet manager that lets you create, share, and collaborate on code in real time. Use AI to search across your snippets, get explanations, and generate new code—all in one place.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Liveblocks](https://img.shields.io/badge/Liveblocks-Collaboration-orange?logo=liveblocks)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## Features

- **Code snippets** — Create and manage snippets with syntax highlighting (Monaco Editor)
- **Version history** — Every save creates a new version with optional change descriptions
- **Real-time collaboration** — Public snippets support live collaborative editing with Liveblocks + Yjs
- **Presence & cursors** — See who else is editing and where their cursors are in real time
- **View-only mode** — Public snippets opened from Discover show static code without Liveblocks (no auth needed)
- **Share with tokens** — Share public snippets via a link; collaborators get edit access with a token
- **Tags & folders** — Organize snippets with tags and folders
- **Discover** — Browse public snippets shared by the community
- **AI chat** — Ask questions about your snippets, find code by description, explain code, generate snippets (powered by Google Gemini)
- **AI snippet help** — Ask about a specific snippet directly from the snippet page
- **Conversation history** — AI chat conversations are saved and can be resumed
- **Auth** — Sign up / sign in with Supabase Auth (email)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (PostgreSQL, Auth)
- **Collaboration:** Liveblocks + Yjs + Monaco (y-monaco)
- **Editor:** Monaco Editor
- **AI:** Google Gemini API
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Liveblocks](https://liveblocks.io) project (for collaborative editing)
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
4. Run the contents of `supabase/migrations/00003_add_tags_and_folders.sql`

### 3. Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Service role key (for collaborative save, token validation) |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | Yes** | Liveblocks public API key |
| `LIVEBLOCKS_SECRET_KEY` | Yes** | Liveblocks secret key (for auth endpoint) |
| `GEMINI_API_KEY` | Yes*** | Google Gemini API key (for AI chat) |

\* Required for saving collaborative edits on public snippets.  
\** Required for real-time collaboration on public snippets. View-only public snippets work without Liveblocks.  
\*** Required for AI chat. Without it, the app works but AI features are disabled.

- **Supabase keys:** Dashboard → Project Settings → API Keys  
- **Liveblocks keys:** [Liveblocks Dashboard](https://liveblocks.io/dashboard/apikeys)  
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
│   │   ├── ai/              # AI chat, ask-snippet, conversations
│   │   ├── liveblocks-auth/ # Liveblocks auth endpoint
│   │   └── snippet/         # Save, regenerate token
│   ├── auth/                # Login, signup, callback
│   ├── chat/                # AI chat page
│   ├── discover/            # Public snippets discovery
│   ├── new/                 # Create snippet
│   ├── snippet/
│   │   ├── [id]/            # View/edit snippet (with loading skeleton)
│   │   │   ├── edit/        # Edit snippet form
│   │   │   ├── loading.tsx  # Loading skeleton
│   │   │   └── page.tsx
│   │   └── layout.tsx       # Snippet layout (sidebar + content area)
│   └── page.tsx             # Dashboard (snippets list)
├── components/
│   ├── collaborative-editor.tsx  # Monaco + Liveblocks Yjs
│   ├── liveblocks-room-wrapper.tsx
│   ├── chat-panel.tsx            # AI chat UI
│   ├── snippet-content.tsx       # Snippet view/edit
│   └── ...
├── lib/
│   └── db.ts                # Database helpers
├── liveblocks.config.ts     # Liveblocks client config
├── supabase/
│   └── migrations/         # SQL migrations
└── utils/
    └── supabase/            # Supabase client (server, client, admin)
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
