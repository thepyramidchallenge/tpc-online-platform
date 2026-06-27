# The Pyramid Challenge — Practice

Interactive **Practice** web app for Hong Kong **K2–P6** students (≈ ages 4–12) —
part of [The Pyramid Challenge](https://thepyramidchallenge.org).

## ▶ Live

**https://thepyramidchallenge.github.io/tpc-online-platform/**

Sign in, pick a topic, practise a timed question set, see your score and review.

## About this repo

This is the **frontend** (a self-contained clickable prototype: `prototype/`).
Question data is bundled; practice results are sent to a backend API. The backend
(a Cloud Run service over Google Sheets) and project docs are maintained
separately and are **not** in this public repo.

> **Business context (the *why*):** vision, pricing/funnel, the moat, and
> validated/unvalidated bets live in the **TPC Business Space** —
> https://thepyramidchallenge.github.io/tpc-dashboard/ (Business space tab) ·
> source `github.com/thepyramidchallenge/tpc-dashboard/tree/main/business`. The
> full project (frontend + backend + docs) is the private `tpc-online-platform-admin` repo.

## Run locally

```bash
cd prototype
python3 scripts/serve.py     # → http://127.0.0.1:5510
```

Then open http://127.0.0.1:5510. To run fully offline (no backend calls), set
`apiUrl: ""` in `prototype/config.js`.

## Tech

Vanilla HTML/CSS/JS — no build step. Bilingual 中/EN, young-learner UX (large
targets, big type). Files: `prototype/index.html · styles.css · app.js ·
backend.js · config.js · data.js · assets/`.
