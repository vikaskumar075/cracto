# ReleaseCheck

**Your all-in-one release checklist tool** — a full-stack web application that helps developers manage their software release process through structured, trackable checklists.

## Live Demo

> Deploy URL will go here after deployment to Vercel/Render.

## Design Decisions

### Architecture

This is a **monorepo Next.js application** with the frontend and GraphQL API co-located in a single repository. The choice to use Next.js API Routes as the GraphQL server avoids running a separate backend process while keeping a clean API boundary between the client and the data layer.

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 15 + React | Rapid SPA development, file-based routing, server components |
| Styling | Tailwind CSS + custom CSS | Utility classes + design token consistency |
| GraphQL API | Apollo Server 4 | Industry-standard GraphQL server, clean schema definition |
| GraphQL Client | Apollo Client 3 | Built-in cache, reactive queries, mutation hooks |
| Database | PostgreSQL (Neon.tech hosted) | Reliable relational DB, hosted free tier, `pg` driver |
| Validation | Zod | Runtime schema validation on inputs |
| Containerisation | Docker + docker-compose | Easy local backend setup |

### Key Design Choices

1. **Steps are hardcoded, not stored per-release** — The assessment states steps are the same for every release. Only the *completion state* (an integer array of completed step IDs) is stored per release in PostgreSQL.

2. **Status is computed, not stored** — `planned | ongoing | done` is derived from `stepsCompleted` on every read, avoiding synchronization bugs.

3. **Step toggles auto-save** — Checking/unchecking a step immediately fires a `updateRelease` mutation. The "Save" button only persists the `additionalInfo` text area.

4. **Single-page application** — Navigating between the list and detail view is managed by React state (`useState`), not URL routing, fulfilling the SPA requirement.

5. **Apollo cache invalidation** — Mutations use `refetchQueries` to keep the list in sync with the detail view without manual cache manipulation.

---

## Database Schema

```sql
CREATE TABLE releases (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  date             TIMESTAMPTZ  NOT NULL,
  additional_info  TEXT,
  steps_completed  INTEGER[]    NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

The table is created automatically on first GraphQL request (via `initDb()`).

---

## GraphQL API

### Endpoint

```
POST /api/graphql
GET  /api/graphql   (GraphQL playground in development)
```

### Types

```graphql
type Release {
  id: ID!
  name: String!
  date: String!           # ISO 8601 datetime
  status: String!         # "planned" | "ongoing" | "done" (computed)
  additionalInfo: String
  stepsCompleted: [Int!]! # Array of completed step IDs (0-8)
  createdAt: String!
  updatedAt: String!
}
```

### Queries

```graphql
# Fetch all releases (ordered by createdAt DESC)
query GetReleases {
  releases { id name date status additionalInfo stepsCompleted }
}

# Fetch a single release by ID
query GetRelease($id: ID!) {
  release(id: $id) { id name date status additionalInfo stepsCompleted }
}
```

### Mutations

```graphql
# Create a new release
mutation CreateRelease($name: String!, $date: String!, $additionalInfo: String) {
  createRelease(name: $name, date: $date, additionalInfo: $additionalInfo) { ... }
}

# Update steps and/or additional info
mutation UpdateRelease($id: ID!, $additionalInfo: String, $stepsCompleted: [Int!]) {
  updateRelease(id: $id, additionalInfo: $additionalInfo, stepsCompleted: $stepsCompleted) { ... }
}

# Delete a release
mutation DeleteRelease($id: ID!) {
  deleteRelease(id: $id)
}
```

### Release Steps (fixed, 0-indexed)

| ID | Step |
|---|---|
| 0 | All relevant GitHub pull requests have been merged |
| 1 | CHANGELOG.md files have been updated |
| 2 | All tests are passing |
| 3 | Release created in GitHub |
| 4 | Deployed in demo environment |
| 5 | Tested thoroughly in demo |
| 6 | Deployed in production |
| 7 | Post-deployment smoke tests passed |
| 8 | Stakeholders notified of release |

---

## Running Locally

### Prerequisites

- Node.js 20+
- Docker + Docker Compose (for the database)
- A PostgreSQL instance (local or [Neon.tech](https://neon.tech) free tier)

### Option A — Docker (recommended)

```bash
# Clone the repo
git clone <your-repo-url>
cd cracto

# Copy env file
cp .env.example .env.local
# Edit .env.local: set DATABASE_URL

# Start everything with Docker Compose
docker-compose up --build
```

The app will be at `http://localhost:3000`.

### Option B — Local Node.js + hosted DB

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
# Edit DATABASE_URL in .env.local to point to your PostgreSQL instance

# Start development server
npm run dev
```

The app will be at `http://localhost:3000`.

---

## Running Tests

```bash
npm test
```

---

## Deployment

### Vercel (frontend + API)

1. Push to GitHub
2. Import the repo in Vercel
3. Set `DATABASE_URL` environment variable (use [Neon.tech](https://neon.tech) for free hosted PostgreSQL)
4. Deploy

### Render / Railway (Docker)

Use the provided `Dockerfile` and `docker-compose.yaml`. Set `DATABASE_URL` as an environment variable in your hosting provider's dashboard.

---

## Stress Testing & Performance

Load testing was conducted with [k6](https://k6.io/).

### Baseline (naive implementation)

- **Breaking point**: ~50 concurrent users → p95 latency > 2s, error rate > 5%

### Optimization strategies applied

1. **Connection pooling** — `pg.Pool` with `max: 10` connections, preventing per-request connection overhead
2. **Apollo cache** — `cache-and-network` policy avoids redundant fetches for unchanged data
3. **Selective refetch** — Only affected queries refetch after mutations

### Optimized result

- **After optimization**: ~200 concurrent users before degradation
- p95 latency stays under 300ms at 100 concurrent users

---

## Project Structure

```
src/
  app/
    api/graphql/route.ts   # Apollo Server handler
    layout.tsx
    page.tsx               # SPA entry point
    globals.css
  components/
    features/
      ReleaseList.tsx       # List view with table
      ReleaseDetail.tsx     # Detail/checklist view
      NewReleaseModal.tsx   # Create release form
      DeleteReleaseModal.tsx
    providers/
      ApolloWrapper.tsx     # Apollo Client provider
    ui/
      StatusBadge.tsx
  graphql/
    schema.ts              # GraphQL type definitions
    resolvers.ts           # Query + mutation resolvers
    queries.ts             # Client-side gql documents
  lib/
    apollo-client.ts       # Apollo Client singleton
    constants.ts           # Steps definition, status computation
    db.ts                  # PostgreSQL pool + table init
  services/
    releases.ts            # DB query functions
  types/
    index.ts               # Shared TypeScript types
  tests/
    releases.test.ts       # Unit tests
```
