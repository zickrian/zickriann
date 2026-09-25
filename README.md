# Personal Portfolio — zickrian.dev

> Source code of my personal portfolio. Built with Next.js 16, React 19, and Tailwind CSS v4.

**Live →** [zickrian.dev](https://www.zickrian.dev)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.8 |
| Styling | Tailwind CSS v4 |
| UI Primitives | Radix UI |
| AI Chat | Groq API (streaming) |
| Email | Resend |
| Deployment | Vercel |

## Features

- **AI Chat Widget** — streaming chat powered by Groq, context-aware about my profile and projects
- **Bilingual** — full Indonesian / English toggle
- **Contact Form** — with AI-assisted email formatting via Groq
- **Blog** — pulls posts from Medium RSS feed
- **GitHub Contributions** — live contribution graph
- **Sound System** — subtle audio feedback on interactions

## Getting Started

**Prerequisites:** Node.js ≥ 22, pnpm ≥ 9

```bash
git clone https://github.com/zickrian/zickriann.git
cd zickriann
pnpm install
cp .env.example .env.local   # fill in your keys
pnpm dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | [groq.com](https://console.groq.com) — free tier available |
| `RESEND_API_KEY` | ✅ | [resend.com](https://resend.com) — free tier available |
| `APP_URL` | optional | Production URL for SEO/OG metadata |

## Scripts

```bash
pnpm dev          # Dev server
pnpm build        # Production build
pnpm check-types  # TypeScript check
pnpm lint         # ESLint
pnpm test         # Unit tests (Vitest)
```

## License

[MIT](./LICENSE) © Firdaus Khotibul Zickrian

