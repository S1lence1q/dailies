# dailies — status & roadmap

Sidst opdateret: **20. juni 2026**

Levende dokument over hvad der virker, hvad vi er i gang med, og hvad der mangler. Opdater denne fil når noget skifter status.

---

## Overblik

**dailies** er en daglig minispil-app (Wordle/Heardle-inspireret) bygget i Next.js. Fire spil er live; to er skjult til senere.

| Spil | Status | Noter |
|------|--------|-------|
| **VERBUM** | ✅ Live | Wordle-style, 50 ord i pool |
| **PITCH** | ✅ Live | iTunes preview-klip, skip afslører mere |
| **RATIO** | ✅ Live | Højere/lavere-kæder |
| **CONTEXT** | ✅ Live | GloVe proximity, hints, give-up, Clueless-inspireret UI |
| **ECHO** | 🔒 Skjult | Trivia — cover/reference, ikke i grid |
| **GLYPH** | 🔒 Skjult | Mønster — cover/reference, ikke i grid |

**Produktion:** [dailies-flame.vercel.app](https://dailies-flame.vercel.app)

---

## ✅ Færdigt (seneste periode)

### Spil & UX
- [x] CONTEXT spil med semantisk motor (GloVe), API-routes (guess, hint, give-up)
- [x] CONTEXT UI: mørk baggrund, orange bars, pinned sidste gæt, hint-bekræftelse, give-up menu
- [x] Ensartede cover-labels (`NO. XXXX`) via `GameCover.tsx`
- [x] Dynamiske puzzlenumre for alle spil
- [x] Korrekt "X / 4 played" tæller
- [x] RATIO-puzzles oversat til engelsk
- [x] Demo-seed data fjernet ved første besøg

### Daily content-system & Admin
- [x] Auto-rotation fra indholdspools (samme dag = samme puzzle globalt)
- [x] Code-overrides i `src/games/content/daily-manifest.ts`
- [x] Lokal JSON-lagring i dev (`daily-overrides-json`)
- [x] Supabase-lagring til prod med fuldt opsat database-migration (`001_daily_overrides.sql`)
- [x] Genindlæsning og validering af database-rettigheder (`grant all privileges to service_role`)
- [x] Server/client split (`daily-overrides-store.server.ts`, `daily-preview.ts`)
- [x] Public API: `GET /api/daily/schedule`
- [x] Dev preview: `?date=YYYY-MM-DD` (kun development)
- [x] `/admin` — password-login via `ADMIN_SECRET`
- [x] Auto-select af morgendagens dato som standard ved load i admin panel
- [x] Venlige, læsbare dato-labels (`Today`, `Tomorrow`, `Sun, Jun 21`) i admin
- [x] Dropdown-valgfelter med sangtitler og sammenligninger for Pitch & Ratio i stedet for tal-id
- [x] Pinned vs. Auto rotation status-badges i admin-listen
- [x] Testet end-to-end override flow — ændring af dag i admin gemmer nu til Supabase og slår igennem med det samme

---

## 🔄 I gang / halvt på plads

### Indholdspools (udvidelse)
- [ ] Flere CONTEXT-målord (pt. ~25 i pool)
- [ ] Flere VERBUM-ord (pt. 50)
- [ ] Flere PITCH-tracks og RATIO-kæder efter behov

### README
- [ ] README.md er forældet (nævner RATIO/CONTEXT som "kommer snart") — bør opdateres

---

## 📋 Mangler at lave

### Høj prioritet
- [ ] **Indholdsudvidelse** — forbered pools med ord og tracks til de kommende uger

### Medium prioritet
- [ ] **Stats på tværs af alle spil** — pt. kun VERBUM har detaljeret distribution i `StatsModal`
- [ ] **Sync stats/streaks til Supabase** — alt ligger i localStorage; `/api/internal/streaks` findes men er ikke wired til UI
- [ ] **PITCH lyd-kvalitet** — afhænger af iTunes preview; overvej fallback/cache strategi
- [ ] **Share-tekst** for alle spil (CONTEXT har det; tjek resten)

### Lavere prioritet / nice-to-have
- [ ] **ECHO** — byg trivia-spil (skjult i registry indtil klar)
- [ ] **GLYPH** — byg mønster-spil (skjult i registry indtil klar)
- [ ] **PWA** — installérbar app, offline cover
- [ ] **Editor notes** — dynamiske daglige tips i `EDITOR_NOTES` (registry) — pt. statisk array
- [ ] **Admin auth upgrade** — email/login via Supabase i stedet for shared password
- [ ] **React Native / Expo** — mobilapp (nævnt i README)

---

## 🗺 Planer & idéer

### Editorial workflow
Målet er at kunne styre dagens indhold uden deploy:
1. **Dev:** gem i `daily-overrides.json` via `/admin`
2. **Prod:** gem i Supabase via `/admin` (kræver service role key)
3. **Nødsituation / launch:** hardcode i `daily-manifest.ts` og deploy

### Grid-layout
Fire live spil bruger et asymmetrisk grid (VERBUM/PITCH/RATIO + CONTEXT fuld bredde). Når ECHO eller GLYPH går live, skal `getGridAreas()` i `registry.ts` opdateres.

### CONTEXT
- Hint-system: max 3/dag, auto-submitter tættere ord
- Give-up tæller som spillet (via `onComplete`)
- Starterord: space, time, water

### Design
- CONTEXT har eget mørkt tema; resten følger Figma-tokens
- ECHO/GLYPH covers beholdes som design-reference selvom spilene er skjulte

---

## 🔧 Teknisk reference

### Vigtige filer

| Fil | Formål |
|-----|--------|
| `src/games/registry.ts` | Spilliste, visibility, grid-layout |
| `src/lib/daily.ts` | Dag-nøgle, puzzle-numre, dev `?date=` |
| `src/lib/daily-overrides-store.server.ts` | Override-lagring (manifest → JSON → Supabase) |
| `src/lib/daily-preview.ts` | Admin schedule preview |
| `src/components/admin/AdminDailyPanel.tsx` | Admin UI |
| `src/games/content/daily-manifest.ts` | Code-baserede overrides |
| `supabase/migrations/001_daily_overrides.sql` | DB-schema til prod overrides |

### Env vars

| Variabel | Krævet til |
|----------|------------|
| `ADMIN_SECRET` | Admin login |
| `SUPABASE_URL` + keys | Auth, streaks API, overrides |
| `SUPABASE_SERVICE_ROLE_KEY` | Gem overrides i prod (Vercel) |
| `SUPABASE_SECRET_KEY` | Server SDK, kan bruges som fallback til service client |

### API-routes (udvalg)

| Route | Beskrivelse |
|-------|-------------|
| `GET /api/daily/schedule` | Public daglig schedule (uden context-svar) |
| `GET/PUT/DELETE /api/admin/daily` | Admin CRUD for overrides |
| `POST /api/admin/session` | Admin login |
| `POST /api/context/guess` | CONTEXT gæt |
| `POST /api/context/hint` | CONTEXT hint |
| `POST /api/context/give-up` | CONTEXT opgiv |

---

## 📝 Changelog (kort)

| Dato | Ændring |
|------|---------|
| Jun 2026 | CONTEXT spil + daily content system + admin panel |
| Jun 2026 | Admin schedule-load fix (Supabase graceful fallback) |
| Jun 2026 | 4 live spil, ECHO/GLYPH skjult |

---

*Opdater STATUS.md når du afslutter et punkt — flyt det fra "Mangler" til "Færdigt" med dato.*
