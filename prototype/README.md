# TPC Practice — clickable prototype

A self-contained **web** prototype of the Phase-1 free Practice flow. No build
step — it runs in a browser using the real K2/K3 questions + images. When
`prototype/config.js` has `apiUrl` set, it mirrors users, sessions, attempts, and
bookmarks to the Cloud Run SheetsBackend.

## Run it

Because it loads `data.js` and images, open it via a tiny local web server (not
`file://`):

```bash
cd "prototype"
python3 scripts/serve.py        # serves http://127.0.0.1:5510
```
Then open **http://127.0.0.1:5510** in Chrome/Safari.
(Any static server works, e.g. `npx serve` — `scripts/serve.py` just avoids a sandbox quirk.)

To put it online (e.g. your Google Drive is not a host — use Firebase Hosting,
Netlify, or GitHub Pages): upload the whole `prototype/` folder; it's all static.

## What it does (matches the wireflow)

- **Sign in** — simulated Google sign-in (prototype stand-in).
- **First-login setup** — name + one year level (one email · one child · one level).
- **Home** — big Practice / Report buttons, recent activity, bookmarks.
- **Practice setup** — topic (or Mixed), question count, feedback mode (instant / at-end).
- **Question** — timer, progress, real images, tap answers, flag/bookmark;
  instant mode shows feedback per question.
- **Result** — score, accuracy, stars, per-question review.
- **Report** — by-topic accuracy, history, bookmarks.
- **Profile** — change level, notifications toggle, language, sign out.

## Prototype vs production (stand-ins)

| Prototype | Production (see `../docs/ARCHITECTURE.md`) |
|---|---|
| Simulated Google button | Real Google Sign-In (Firebase/Supabase Auth) |
| `localStorage` | Google Sheets (then Firestore/Supabase) via the backend adapter |
| Local images in `assets/` | Image URLs stored in the Questions sheet |
| 40 real K2/K3 questions | Full bank; Practice served as AI-generated ~70% variants |

## Files
`index.html` · `styles.css` · `app.js` · `data.js` (generated) · `assets/` ·
`scripts/build-data.py` (regenerates `data.js` + copies images from `../sheets-template` & `../assets`).

> Note: only **K2 and K3** have questions in this prototype. Pick K2 or K3 at
> sign-in (or in Settings) to practise; other levels show an empty-state message.
