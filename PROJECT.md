# dailies — Projektbeskrivelse & Vision

Dette dokument beskriver kernen i **dailies**-projektet: Hvad vi forsøger at opnå, vores designfilosofi, og hvor vi er på vej hen.

---

## 🎯 Hvad er **dailies**?

**dailies** er en samlet portal for daglige minispil, inspireret af succeser som Wordle, Heardle og Semantle, men samlet i ét unikt, sammenhængende univers. Formålet er at give brugerne en kort, engagerende og visuelt tilfredsstillende daglig rutine, hvor de kan teste deres ordforråd, musikøre, intuition og logik.

### De 4 Live Minispil:
1. **VERBUM:** En fortolkning af Wordle (gæt et 5-bogstavs ord på 6 forsøg) med et stærkt fokus på sprød typografi.
2. **PITCH:** En Heardle-klon, hvor spilleren skal gætte dagens sang ud fra korte lydklip. Lydklippene matches dynamisk via iTunes Search API.
3. **RATIO:** Et "Højere eller lavere"-spil, der præsenterer skøre, absurde sammenligninger (f.eks. vægten af AirPods Pro vs. antallet af ben på et tusindben).
4. **CONTEXT:** Et semantisk ordgættespil baseret på GloVe ord-vektorer, hvor spilleren skal gætte et hemmeligt ord ud fra, hvor tæt ens gæt er på målordets betydning.

---

## 🎨 Designfilosofi: Taktil Hardware vs. "AI Slop"

Det vigtigste princip i **dailies** er vores visuelle identitet. Vi ønsker at skabe en brugeroplevelse, der føles premium og fængslende ved første øjekast, men som følger en meget specifik æstetik:

### 🛠️ Fysisk og Taktilt Design (Hardware Aesthetic)
* Vi designer appen som et fysisk instrument (en synthesizer, et kontrolpanel eller en effektpedal). 
* Elementer har skarpe, faste rammer (enkeltpixel-borders), klare kontraster og føles mekaniske.
* Knapper har en mærkbar fysisk tryk-effekt (subtil scaling og skyggeskift ved klik), der understøtter følelsen af at trykke på en fysisk knap.

### 🚫 Ingen "AI Slop"
* Vi undgår de generiske, moderne webdesign-skabeloner, som ofte kendetegner hurtigt genererede AI-sider.
* **Nej tak til:** Tilfældige neongradienter, svævende pastelfarvede baggrunds-blobs, overdreven brug af blød glassmorphism og unødvendig belysning.
* Alt design skal være bevidst, funktionelt, stramt og tro mod det fysiske hardware-look.

### 🔊 Procedural Lyd (Web Audio API)
* Spillet bruger en specialdesignet lydmotor bygget direkte på Web Audio API. 
* Ingen tunge lydfiler eller eksterne samples – alle kliklyde, succes-arpeggioer og fejl-lyde genereres syntetisk i realtid, hvilket understøtter synthesizer-temaet.

---

## 🛠️ Teknisk Arkitektur

Projektet er bygget til at være lynhurtigt, robust og nemt at vedligeholde:

* **Next.js 16 (App Router) + TypeScript:** Sikrer stærk typisering og server-side rendering for optimal ydeevne og SEO.
* **Tailwind CSS 4:** Bruges stramt i overensstemmelse med sidens design-tokens (BG, FG, ACCENT, BORDER).
* **Supabase database:** Bruges til at gemme daglige overstyringer (overrides) og på sigt synkronisere streaks og stats.
* **Dynamisk Administrationspanel (`/admin`):** Gør det muligt for redaktøren at fastlåse (pinne) sange, ord og puzzles for de kommende 14 dage direkte i databasen uden at skulle gen-deploye koden.

---

## 🚀 Fremtidige Mål (Roadmap)

1. **Global Stats-synkronisering:** Gøre det muligt for spillere at logge ind med Supabase for at gemme deres streaks og spilstatistikker på tværs af mobil, computer og tablet.
2. **Nye Minispil:** Udvikle og åbne op for de to låste spil i koden:
   * **ECHO:** Et trivia-spil baseret på ledetråde.
   * **GLYPH:** Et mønster-genkendelsesspil.
3. **PWA (Progressive Web App):** Gøre det muligt at installere portalen direkte på telefonens startskærm med offline-understøttelse og hurtig adgang.
4. **Indholdsredaktion:** Etablere store og varierede pools af ord, sange og dueller, så spillet kan køre fejlfrit og uden gentagelser i årevis.
