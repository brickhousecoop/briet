# `jacket` — BRIET homepage

The main [briet.app](https://briet.app/) site. Next.js 16 (app router) + React 19, content from the BRIET Catalog (Sanity).

## Development

1. `npm install` from the repo root
2. Put `NEXT_PUBLIC_SANITY_PROJECTID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local`
3. `npm run dev:local` (plain `next dev`)

`npm run dev` instead runs the full Vercel flow (project `bh-briet-jacket`), which requires membership in the Brick House Vercel team.
