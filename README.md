# dailies

Daily mini games — ported from [Figma Make](https://www.figma.com/make/zH8ULDPd5WYR1Pj2oKA5Ym/Homepage-for-Daily-Mini-Games) to a production Next.js app.

## Spil

| Spil | Status | Beskrivelse |
|------|--------|-------------|
| **VERBUM** | ✅ Spilbar | Wordle-style ordspil |
| **PITCH** | ✅ Spilbar | Heardle-style musikgæt med rigtige iTunes preview-klip og lydeffekter |
| **RATIO** | ✅ Spilbar | Højere eller lavere sammenligninger af skøre værdier |
| **CONTEXT** | ✅ Spilbar | Gæt det hemmelige ord baseret på semantisk nærhed (GloVe) |
| ECHO | 🔒 Kommer snart | Trivia — seks ledetråde |
| GLYPH | 🔒 Kommer snart | Mønster-genkendelse |

## Kom i gang

```bash
npm install
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000).

## Login (valgfrit)

Spil virker uden konto (localStorage). For at synce streaks på tværs af enheder:

1. Opret et [Supabase](https://supabase.com)-projekt
2. Kopiér `.env.example` → `.env.local` og indsæt nøglerne fra **Connect**-dialogen
3. Gå til `/login`

### Supabase server SDK

API-routes bruger `@supabase/server` med `withSupabase` (via `createRouteHandler`):

| Route | Auth mode | Beskrivelse |
|-------|-----------|-------------|
| `GET /api/health` | `none` | Health check |
| `GET /api/me` | `user` | Aktuel bruger (JWT fra cookie eller `Authorization` header) |
| `GET /api/games` | `publishable` | Kræver `apikey: sb_publishable_...` header |
| `POST /api/internal/streaks` | `secret` | Kræver `apikey: sb_secret_...` header |

Påkrævede env-variabler (server):

```
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY          # til supabaseAdmin / auth: 'secret'
SUPABASE_JWKS_URL            # JWT-verifikation for auth: 'user'
```

## Stack

- **Next.js 16** + React 19 + TypeScript
- **Tailwind CSS 4** med design tokens fra Figma
- **motion** (animationer), **sonner** (toasts), **lucide-react** (ikoner)
- **@supabase/server** + **@supabase/ssr** (auth, RLS-scoped clients)

## Projektstruktur

```
src/
├── app/              # Next.js routes (homepage, login, auth callback)
├── components/
├── components/admin/ # Adminpanel til at fastlåse daglige spil
│   ├── dailies/      # Spil + homepage fra Figma
│   └── auth/         # Login-knap
└── lib/supabase/     # Supabase-klienter
```

## Næste skridt

- [ ] Synce streaks og stats til Supabase
- [ ] Byg ECHO og GLYPH færdig
- [ ] React Native / Expo mobilapp

