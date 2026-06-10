# Fastwork Landing Page

Static marketing site with React-powered sections (story stack, pricing, hero blur) built as a Vite library bundle.

## Local development

```bash
npm install
npm run build:story-stack   # rebuild React bundle into assets/story-stack
# serve the repo root with any static server, e.g.:
npx serve .
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel reads `vercel.json` automatically:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Click **Deploy**.

No environment variables are required.

## Build pipeline

`npm run build` runs `scripts/build-site.mjs`, which:

1. Builds the React story-stack bundle with Vite
2. Copies `index.html`, `styles.css`, `script.js`, `aurora.js`, and `assets/` into `dist/`

Vercel serves the `dist/` folder as a static site.
