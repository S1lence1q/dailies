# dailies — design plan

Sidst opdateret: **20. juni 2026**

Plan for at gøre dailies til **én daglig oplevelse** — ikke fire spil på en liste.  
Skrevet med én regel forrest: **ingen AI-slop.**

---

## North star

dailies skal føles som at åbne en **lille daglig udgivelse** — avis, zine, redaktionelt site. Ikke en gaming-app, ikke en crypto-dashboard, ikke en SaaS landing page med gradient blobs.

Det I allerede har er rigtigt:
- Beige papir (`#F0EBE1`), mørk blæk (`#18120E`)
- Fraunces kursiv til titler, DM Mono til metadata
- Flade farveflader per spil — ingen skygger, ingen glassmorphism
- CONTEXT's orange bars — funktionel, ikke pynt

Alt nyt skal passe ind i det sprog.

---

## Anti-slop regler (læs før hver feature)

| Gør | Gør ikke |
|-----|----------|
| 150–250ms ease transitions | 3D transforms, parallax, particles |
| Typografi der bevæger sig (opacity, letter-spacing) | Glow, neon, gradient borders |
| Én lyd eller ét visuelt beat per handling | Konfetti, fire emojis, "achievement unlocked" |
| Print-inspireret layout (regler, margins, masthead) | Spinning vinyl, pulserende waveforms, skeuomorph |
| Tom plads — lad det ånde | Fyld hvert hjørne med animation |
| Funktion først (progress, næste spil, share) | Animation for animationens skyld |

**Test:** Hvis det kunne være genereret af en "make it pop"-prompt, så er det forkert.

---

## Hvad vi bygger (og hvad vi dropper)

### Bygger

1. **Dagens udgave** — progress og hero der reagerer på hvor langt du er
2. **Flow mellem spil** — rolig handoff, ikke cinematic trailer
3. **All done-øjeblik** — typografisk afslutning + samlet share
4. **Micro-interactions** — små, præcise, per spil
5. **Editor's note** — koblet til faktisk indhold

### Dropper (bevidst)

- Vinyl der spinner, equalizer der danser, 3D cards
- Fulskærms confetti / streak-explosion
- Expand-from-tile animation (for meget kompleksitet for nu — kan komme senere, simpelt)
- Weekend "special edition" med nyt layout (for tidligt)
- ECHO/GLYPH blur-teasers (distraherer fra de fire live spil)
- Første-besøg onboarding-carousel

---

## Fase 1 — Dagens rytme ✅

*Implementeret 20. jun 2026*

### 1.1 Progress strip (forside)

Under "Today's Lineup" — ikke en fed progress bar, bare:

```
2 / 4 played    VERBUM · PITCH · — · —
```

- Færdige spil: fuld opacity, lille check
- Næste: understreget eller fed
- Resten: 35% opacity

**Micro:** når et spil afsluttes og modal lukkes, opdateres strippen med 200ms fade — ikke bounce.

### 1.2 Reaktiv hero

Hero-sektionen (pt. altid VERBUM) skifter efter status:

| Status | Hero indhold |
|--------|--------------|
| 0/4 | Næste uspillede spil i rækkefølge (VERBUM → PITCH → RATIO → CONTEXT) |
| 1–3/4 | Samme — altid **næste** uspillede, med spillets farver |
| 4/4 | Mørk flade (`#18120E`), dagens fire resultater som én linje mono-tekst + share-knap |

Ingen ny animation på hero — bare indholdsskift med eksisterende fade (motion, 0.4s).

### 1.3 All done

Erstat det nuværende sorte bånd med noget der føles **afsluttet**, ikke "alert box":

```
ALL DONE FOR TODAY
VERBUM 3/6 · PITCH 2/6 · RATIO 7/10 · CONTEXT 12
New puzzles in 04:32:18
[ Share today's dailies ]
```

- Samlet share-tekst (Wordle-style, ren tekst — ingen genereret billede)
- Streak vises som tal, ikke animation — `🔥 5` er nok
- Fjern forvirrende "streak + 1 tomorrow" — vis bare nuværende streak

**Micro:** sektionen fader ind (opacity 0→1, 300ms). Intet andet.

### 1.4 Næste spil efter afslutning

I `GameCompleteActions` — når der er et næste spil:

- Behold Share + Play next
- Tilføj én linje over knapperne: `NEXT · PITCH` i mono, lille
- Play next-knappen bruger **næste spils accent-farve** som border — ikke glow

Når 4/4 i det spil: knap hedder "Back to lineup" i stedet for next.

**Filer:** `DailiesApp.tsx`, `GameCompleteActions.tsx`, ny `buildDailyShareText()` i `src/lib/share.ts`

---

## Fase 2 — Covers der husker resultatet

*Mål: Grid'et føles som et scorekort, ikke fire klikbare bokse.*

### 2.1 Resultat på cover (efter spil) ✅

*Implementeret 20. jun 2026*

I stedet for generisk `3/6 · won`:

| Spil | Cover efter spil |
|------|------------------|
| VERBUM | Mini emoji-række (eksisterende grid-logik, 6 felter, små firkanter) |
| PITCH | `2/6` + kort artist-navn hvis tabt/vundet |
| RATIO | `7/10` — tallet i Fraunces, stort men dæmpet |
| CONTEXT | Orange bar for bedste rank (som i spillet, mini) |

Alt i spillets egne farver. Ingen nye komponenter — genbrug tokens fra hvert spil.

### 2.2 Cover hover (kun desktop) ✅

*Implementeret 20. jun 2026*

Subtile, **én ting per spil**:

| Spil | Hover |
|------|-------|
| VERBUM | `letter-spacing` på titlen går fra `-0.03em` → `0` (200ms) |
| PITCH | Statiske bars får +0.1 opacity — de bevæger sig ikke |
| RATIO | `>` i baggrunden skifter 9% → 14% opacity |
| CONTEXT | Understregning vokser under titlen (1px linje, accent) |

Mobil: ingen hover — tap er nok.

### 2.3 Dim uafsluttede (valgfrit, test først) ✅

*Implementeret 20. jun 2026*

Når 1+ spil er færdige: uafsluttede covers på 92% brightness (allerede delvist der med `filter`).  
Næste uspillede cover: **ingen** dim — det er det eneste der "inviterer".

**Filer:** `GameCover.tsx`, evt. lille `CoverResult.tsx`

---

## Fase 3 — Micro-interactions i spil

*Mål: Hvert spil har én signatur-følelse. CONTEXT er benchmark.*

Princip: **state change = kort feedback**. Max 200ms. Eksisterende `audioFX` hvor det allerede giver mening.

### VERBUM
- [ ] Bogstav-tile: scale 0.97 → 1 på indtastning (allerede delvist via keyboard?)
- [ ] Flip ved evaluering: 3D flip **nej** — farve fade 0→100ms (grøn/gul/grå)
- [ ] Række submit: kort horisontal "settle" (translateY 2px → 0)

### PITCH
- [ ] Skip: næste klip-segment — visuelt bare ny progress-markering på en **statisk** tidslinje (ikke waveform der bevæger sig)
- [ ] Korrekt gæt: eksisterende `playSuccess()` — intet visuelt ekstra
- [ ] Forkert: én linje ryster 4px (translateX), 120ms — som RATIO allerede gør

### RATIO
- [ ] Korrekt: kort grøn flash på det vindende kort (opacity pulse, ikke glow)
- [ ] Forkert: beholde eksisterende shake — det virker
- [ ] Ny runde: kort slide-in fra højre (8px, 180ms)

### CONTEXT
- [ ] Behold orange bars — det er allerede rigtigt
- [ ] Ny gæt i listen: fade + slide 6px op (ikke staggered cascade)
- [ ] Hint bekræftelse: eksisterende dialog — OK

**Filer:** per game component. Ingen shared animation library — copy the restraint, not the code.

---

## Fase 4 — Redaktionelt lag

*Mål: Forsiden føles kurateret, ikke genereret.*

### 4.1 Masthead (header)

Tilføj til header, kun desktop:

```
FRI · JUN 20          dailies          🔥 5
```

Mono, 0.62rem, muted — spejler datoen der allerede vises, bare strammere.

### 4.2 Editor's note fra indhold

Erstat statisk `EDITOR_NOTES[dayOfWeek]` med kort tekst genereret fra dagens puzzle:

- Hvis admin har pinnet: "Editor picked today's CONTEXT — nautical."
- Ellers: roter 3–4 neutrale templates baseret på auto-rotation ("Today's lineup runs heavy on words." / "RATIO gets weird today.")

Skriv templates i menneske-tone — **ikke** LLM-genereret per dag.

**Filer:** `src/lib/editor-note.ts`, `DailiesApp.tsx`, admin kan få valgfrit `note`-felt senere

### 4.3 Share der føles skrevet

Én format for hele dagen:

```
dailies · Jun 20
VERBUM 3/6
PITCH 2/6
RATIO 7/10
CONTEXT 12

🔥 5
```

Ingen URL spam, ingen "Play at dailies-flame.vercel.app!!!". Valgfri kort URL på sidste linje.

---

## Rækkefølge & estimat

| Fase | Hvad | Tid | Impact |
|------|------|-----|--------|
| **1** | Progress strip, reaktiv hero, all done, daily share, next-game copy | ~1 dag | Høj — hele dagens flow |
| **2** | Cover results, hover micro, dim | ~1 dag | Medium — grid føles levende |
| **3** | Per-spil micro (VERBUM → RATIO → PITCH polish) | ~1–2 dage | Medium — spil føles færdige |
| **4** | Masthead, editor note, share format | ~0.5 dag | Lav-medium — tone of voice |

**Start med Fase 1.** Stop og ship. Evaluer om Fase 2 er nødvendig før I går videre.

---

## Definition of done (per feature)

- [ ] Virker på mobil (375px) uden hover-afhængighed
- [ ] Ingen animation over 300ms (undtagen modal enter, som allerede findes)
- [ ] Ingen nye farver uden for spillets palette + site tokens
- [ ] Kan skilles fra uden at bryde spil-logik
- [ ] Føles OK med `prefers-reduced-motion` — respekter det (fade only, skip shake)

---

## Reference mood (ikke kopier)

- **NYT Games** — ro, typografi, dagligt ritual
- **Wordle** — emoji grid som share, ingen fest
- **Teenage Engineering** — præcision, få bevægelser
- **Monocle / Kinfolk** — redaktionelt, papir

Ikke reference: Duolingo streak animation, Apple Vision Pro UI, Spotify Wrapped.

---

## Næste skridt

1. Godkend denne plan (eller trim Fase 2–4)
2. Implementer Fase 1 i én PR
3. Opdater `STATUS.md` med link til denne fil

*Hold planen kort. Hvis et punkt føles som "ville ChatGPT foreslå det?", stryg det.*
