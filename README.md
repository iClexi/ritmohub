<div align="center">

# RitmoHub

### A music community platform for artists, bands, students, producers, promoters, and fans.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232a?style=for-the-badge&logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-30557c?style=for-the-badge&logo=postgresql&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-7c3aed?style=for-the-badge&logo=zod&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362d59?style=for-the-badge&logo=sentry&logoColor=white)
![Music](https://img.shields.io/badge/Music_Community-f59e0b?style=for-the-badge&logo=musicbrainz&logoColor=111827)

**Tags:** `music-platform` · `nextjs` · `typescript` · `postgresql` · `social-network` · `courses` · `events` · `self-hosted`

</div>

---

## What It Is

RitmoHub is a full-stack music community web application. It brings together artist profiles, social posting, forums, events, opportunities, bands, course content, and account management in one product.

The project is built as a production-style Next.js application with PostgreSQL persistence, typed validation, security-conscious session handling, email/SMS recovery flows, optional OAuth integrations, and a standalone deployment mode.

## Product Vision

RitmoHub is designed as a digital home for music activity:

- artists can build profiles and publish updates,
- fans can discover people and content,
- bands can coordinate members and invitations,
- students can access learning material,
- promoters can publish events and opportunities,
- admins can inspect platform health and traffic.

The goal is not to be a generic feed. The app is shaped around music identity, collaboration, learning, and discovery.

## Features

- Modern landing experience for a music-first community.
- Email/password registration and login.
- Google OAuth login support.
- Optional Meta OAuth configuration.
- Account verification flows.
- Password reset through email.
- SMS-based verification and recovery hooks.
- Persistent sessions.
- Artist/user profiles.
- Stage name, bio, instrument, location, avatar, cover, and social links.
- Feed posts and likes.
- Forum posts, comments, media, and categories.
- Direct and group chat data structures.
- Events and concerts.
- Creative/music opportunities.
- Bands, band members, and invitations.
- AcademiaX course area.
- Course modules and lesson player.
- Course purchase/checkout integration points.
- Admin users panel.
- Admin traffic/activity panel.
- Visit tracking with explicit internal components.
- Sentry configuration through environment variables.
- Standalone Next.js build for server deployment.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS |
| Forms | React Hook Form |
| Validation | Zod |
| Database | PostgreSQL via `pg` |
| Auth | Custom session/auth helpers, bcryptjs |
| Email | Nodemailer |
| SMS | Brevo integration hooks |
| Motion | Anime.js, Lenis |
| Observability | Sentry for Next.js |
| Deployment | Next.js standalone output behind a reverse proxy |

## Project Structure

```text
ritmohub/
├── src/
│   ├── app/                 # App Router pages, layouts, metadata, robots, sitemap
│   ├── components/          # UI, auth, profile, admin, courses, home
│   ├── lib/                 # Auth, db, validation, email, SMS, security, cache
│   ├── instrumentation.ts   # Server instrumentation
│   └── proxy.ts             # Request/security middleware boundary
├── db/
│   ├── init.sql
│   └── grants-public.sql
├── scripts/
│   └── migration and standalone helper scripts
├── public/
├── next.config.ts
├── package.json
└── README.md
```

## Environment

Use `.env.example` as a template and keep real values outside Git.

Important groups:

| Group | Variables |
| --- | --- |
| Public app URL | `NEXT_PUBLIC_APP_URL` |
| PostgreSQL | `DATABASE_URL` or `DB_*` values |
| Schema setup | `DB_INIT_SCHEMA` |
| Email | `SMTP_*` |
| SMS | `BREVO_*` |
| Seed controls | `ENABLE_SEED_ROUTES`, seed tokens/passwords |
| Payments | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, PayPal values |
| OAuth | `GOOGLE_*`, `META_*` |
| Observability | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_*` |

Never commit real credentials, database URLs, OAuth secrets, seed passwords, Sentry auth tokens, or filled runtime environment files.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The development server uses port `5155` by default.

Useful commands:

```bash
npm run dev      # Start Next.js development server
npm run build    # Production standalone build
npm run lint     # ESLint
npm start        # Next.js start command
```

## Standalone Deployment Note

This application uses Next.js `output: "standalone"`.

Next.js does not automatically place `public/` and `.next/static/` into the standalone tree for every deployment workflow. The `postbuild` script copies them after `next build`.

If a deployment syncs source without running `npm run build`, run the standalone healing script before declaring the release healthy, otherwise static assets and route assets can be missing.

## Security Notes

- Passwords are hashed with bcryptjs.
- Auth and recovery flows are validated with typed helpers.
- Sensitive seed routes are gated by environment configuration.
- Security headers are configured through the app/proxy boundary.
- Email, SMS, OAuth, payment, and Sentry integrations are configured only through environment variables.
- Admin views are separated from public pages.
- Do not place secrets in README, source code, screenshots, issues, commits, or build artifacts.

## Operational Checks

Before a production release:

```bash
npm run build
npm run lint
```

Then verify:

- the server process starts,
- the landing page renders,
- static assets load,
- login/register routes work,
- admin pages require admin access,
- Sentry or other optional providers do not block startup when unset.

## License

Private project unless a license is added. Respect the community, user privacy, and provider terms for any third-party integrations.
