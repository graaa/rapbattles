# RapBattle Voter

A production-ready MVP for a live rap-battle voting system built with Turborepo, Next.js, FastAPI, PostgreSQL, and Redis.

## Features

- **One QR per event**: QR codes link to battle pages with signed event tokens
- **Real-time voting**: Users can vote for MC A or MC B with live tallies
- **Anti-abuse protection**: Rate limiting, device fingerprinting, and one vote per device per battle
- **Live presenter screen**: Real-time updates via Server-Sent Events
- **Admin controls**: Simple interface to open/close battles and generate QR codes
- **Type-safe**: Full TypeScript support across the stack

## Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + Alembic
- **Database**: PostgreSQL 16
- **Cache/Real-time**: Redis 7
- **Infrastructure**: Docker Compose for local development

## Quick Start

### Prerequisites

- Node.js 18+ with pnpm
- Docker and Docker Compose
- Python 3.11+

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd rapbattles
   pnpm install
   ```

2. **Set up environment**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start infrastructure**:
   ```bash
   docker compose up -d
   ```

4. **Run database migrations**:
   ```bash
   cd apps/api
   alembic upgrade head
   ```

5. **Start development servers**:
   ```bash
   pnpm dev
   ```

This will start:
- Web app: http://localhost:3000
- API: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Project Structure

```
rapbattles/
├── apps/
│   ├── web/          # Next.js app (vote, presenter, admin)
│   └── api/          # FastAPI service
├── packages/
│   ├── ui/           # Shared React components
│   └── core/         # Shared TypeScript types and API client
├── infra/
│   ├── db/           # Alembic migrations
│   └── scripts/      # Utilities and load tests
└── docker-compose.yml
```

## Usage

### 1. Admin Panel

Visit `/admin` to:
- Create new battles
- Open/close battles for voting
- Generate QR code URLs for events

### 2. Voting

Users scan QR codes that link to `/battle/[id]?t=<event_token>`:
- Vote for MC A or MC B
- One vote per device per battle
- Real-time tally updates

### 3. Presenter Screen

Visit `/presenter/[id]` for:
- Live voting results
- Animated bar charts
- Real-time updates via SSE

## API Endpoints

### Public
- `GET /healthz` - Health check
- `GET /battles/{id}` - Get battle details
- `POST /vote` - Cast a vote (requires event token)
- `GET /tallies/{id}` - Get current tallies
- `GET /sse/battles/{id}` - Server-sent events for live updates

### Admin
- `POST /admin/battles/{id}/open` - Open battle for voting
- `POST /admin/battles/{id}/close` - Close battle
- `POST /admin/events/{id}/token` - Generate event token

## Security Features

- **Event tokens**: JWT-based authentication for event access
- **Rate limiting**: Per-IP soft caps to prevent abuse
- **Device fingerprinting**: Stable device IDs to prevent duplicate votes
- **Input validation**: Pydantic schemas for all API requests
- **SQL injection protection**: SQLAlchemy ORM with parameterized queries

## Development

### Scripts

```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type check
pnpm typecheck

# Format code
pnpm format
```

### Database Migrations

```bash
# Create new migration
cd apps/api
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Environment Variables

See `env.example` for all required environment variables:

- `SIGNING_SECRET`: Secret for JWT token signing
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `ADMIN_KEY`: Admin authentication key
- `NEXT_PUBLIC_API_BASE`: API base URL for frontend

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Security

See [SECURITY.md](./SECURITY.md) for security considerations and best practices.

## License

MIT
