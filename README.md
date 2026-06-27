# The Pyramid Challenge — Practice

A free, interactive **Practice** web app for Hong Kong **K2–P6** children
(約 4–12 歲) from [The Pyramid Challenge](https://thepyramidchallenge.org).

## ▶ Try it
**https://thepyramidchallenge.github.io/tpc-online-platform/**

Your child signs in with a Google account, picks a topic, practises a short timed
set of questions, and sees their score with answers to review — bilingual 中／英,
built for young learners (big buttons, big type, a simple flow).

## About this repo
This is the **public frontend** of the Practice app — the same thing that runs at
the link above (built with React). The question/marking service and the project's
working documents live in a separate private repo (`tpc-online-platform-admin`) and
are **not** here. The `prototype/` folder is an **earlier reference version** kept
for history; it is not what the live site runs.

## For developers
Production is a React + Vite build published to GitHub Pages. To run the older
`prototype/` reference locally:

    cd prototype && python3 scripts/serve.py   # → http://127.0.0.1:5510
