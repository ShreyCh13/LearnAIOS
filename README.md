# LMS Monorepo

A pnpm monorepo for a Learning Management System built with TypeScript, Express, Next.js, and Prisma.

## Structure

```
apps/
  api/          - Express + TypeScript backend
  web/          - Next.js 14+ App Router frontend
packages/
  db/           - Prisma client + migrations
  types/        - Shared domain types
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
# Create .env file in the root
DATABASE_URL="postgresql://user:password@localhost:5432/lms_db?schema=public"
API_PORT=4000
JWT_SECRET="your-secret-key-here"
OPENAI_API_KEY="your-openai-api-key-here"
```

## Environment Variables

Required for `apps/api`:

- `DATABASE_URL` – PostgreSQL connection string.
- `JWT_SECRET` – Secret for signing and verifying JWTs.
- `OPENAI_API_KEY` – API key for the LLM provider.

Optional:

- `API_PORT` – Port for the API server (default: 4000).

3. Generate Prisma client:
```bash
cd packages/db
pnpm prisma:generate
```

### Development

Run both apps concurrently:
```bash
pnpm dev
```

Or run individually:
```bash
pnpm dev:api   # API server on port 4000
pnpm dev:web   # Next.js on port 3000
```

## Architecture

- **Backend**: Express server with CORS, Morgan logging, JWT support
- **Frontend**: Next.js with API proxy rewrites to backend
- **Database**: Prisma ORM with PostgreSQL
- **Types**: Shared TypeScript interfaces and branded types

