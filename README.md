# LeadHunter

LeadHunter monitors selected Telegram chats, detects potential clients by
include phrases and stop phrases, stores messages and leads in PostgreSQL, and
sends lead notifications through a Telegram bot.

The current milestone is a single-account Telegram MVP. Russian and English
messages are supported. Discord, Instagram, the web dashboard, VPS deployment,
and optional AI classification are later milestones.

## Stack

- TypeScript, pnpm, Turborepo
- NestJS API and Next.js web application
- PostgreSQL and Prisma
- GramJS user client for monitoring Telegram
- Telegram Bot API for notifications

## Local setup (Windows + Docker Desktop)

Requirements: Node.js 24+, pnpm 10+, Git, and Docker Desktop.

```powershell
git clone https://github.com/onlytoil/LeadHunter.git
cd LeadHunter
pnpm install
Copy-Item .env.example .env
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
```

Keep `TELEGRAM_ENABLED=false` until Telegram credentials are ready. The API can
be started without Telegram:

```powershell
pnpm --filter api dev
```

## Telegram setup

1. Create a Telegram application at `my.telegram.org` and put only `api_id` and
   `api_hash` in the root `.env` as `TELEGRAM_API_ID` and
   `TELEGRAM_API_HASH`.
2. Run `pnpm telegram:login`. Complete the prompts locally and copy the printed
   session into `TELEGRAM_SESSION`. Treat this session like a password.
3. Create a notification bot with `@BotFather`, send the bot one message, and
   set `TELEGRAM_BOT_TOKEN` plus `TELEGRAM_NOTIFICATION_CHAT_ID`.
4. Set `TELEGRAM_ENABLED=true`.
5. Start the API and manage monitored chats plus include/exclude keyword
   rules through the `/monitoring-settings` API.

The active chat list is loaded when the API starts. Restart the API after
adding, deleting, enabling, or disabling monitored chats.

Never commit `.env`, `api_hash`, login codes, 2FA passwords, bot tokens, or the
Telegram session string.

## Monitoring settings API

```text
GET    /monitoring-settings
POST   /monitoring-settings/chats
POST   /monitoring-settings/keyword-rules
PATCH  /monitoring-settings/chats/:id
PATCH  /monitoring-settings/keyword-rules/:id
PATCH  /monitoring-settings/chats/:id/active
PATCH  /monitoring-settings/keyword-rules/:id/active
DELETE /monitoring-settings/chats/:id
DELETE /monitoring-settings/keyword-rules/:id

```

Chats and keyword rules are stored in PostgreSQL. Include and exclude matching
is case-insensitive and supports Russian and English messages.

## Commands

```text
pnpm dev                 Start all applications in development mode
pnpm build               Build all applications
pnpm lint                Lint all applications
pnpm typecheck           Type-check all applications
pnpm --filter api test   Run API unit tests
pnpm db:generate         Generate Prisma Client
pnpm db:migrate          Apply local database migrations
pnpm telegram:login      Create a local Telegram session
```

`GET /telegram/status` returns whether Telegram monitoring is enabled and the
listener is active. Interactive Telegram login is intentionally not exposed by
HTTP.
