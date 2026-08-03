# Architecture

## Current Telegram MVP

```text
Selected Telegram chats
  -> GramJS listener
  -> RU/EN phrase and stop-phrase filter
  -> PostgreSQL (Channel, Message, Lead)
  -> Telegram Bot API notification
```

The NestJS API owns the single Prisma schema and database client. Telegram user
authentication is performed only by the local `telegram:login` CLI script. The
runtime reuses the resulting encrypted authorization session from environment
configuration.

Redis remains in Docker Compose for a later background-job/retry milestone; it
is not in the synchronous MVP path yet.

## Planned milestones

1. Minimal web dashboard for channels, rules, and lead review.
2. Queue-backed processing and notification retries using Redis.
3. VPS deployment and operational monitoring.
4. Discord source integration.
5. Optional AI semantic analysis after deterministic filtering is stable.
6. Instagram feasibility based on official API access and account type.
