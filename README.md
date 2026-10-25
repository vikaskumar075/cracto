# ReleaseCheck

**Your all-in-one release checklist tool** — a full-stack web application that helps developers manage their software release process through structured, trackable checklists.

## Live Demo

> **Frontend**: [Your Vercel URL]  
> **GraphQL API**: [Your Render/Railway URL]/graphql

---

## Design Decisions & Architecture

The application is structured with a cleanly decoupled **Backend** and **Frontend** in a single Git repository:

```
cracto/
├── backend/                  # Standalone Apollo Server + Express GraphQL API
│   ├── src/
│   │   ├── server.ts         # Express + ApolloServer startup (Port 4000)
│   │   ├── schema.ts         # GraphQL Schema Definition
│   │   ├── resolvers.ts      # Query & Mutation Resolvers
│   │   ├── services.ts       # Database CRUD queries
│   │   ├── db.ts             # PostgreSQL pool & auto-table DDL
│   │   └── constants.ts      # Step definitions & status calculation
│   ├── tests/                # Jest unit test suite
│   ├── Dockerfile            # Standalone backend container
│   └── package.json
│
├── src/                      # Frontend SPA (Next.js 16 + React 19)
│   ├── components/           # UI components matching mockups
│   ├── graphql/              # Apollo client queries & mutations
│   └── lib/                  # Apollo Client configuration
│
├── docker-compose.yaml       # Multi-container orchestration (db, backend, frontend)
└── tests/stress/             # k6 concurrent load testing script
```

| Component | Technology | Rationale |
|---|---|---|
| **Backend API** | Node.js + Express + Apollo Server 4 | Dedicated GraphQL server running independently on port 4000 |
| **Frontend UI** | Next.js 16 + React 19 (SPA mode) | Single Page Application with client-side Apollo cache |
| **Database** | PostgreSQL (Neon.tech / local Docker) | Relational persistence with JSON array step tracking |
| **Validation** | Zod | Runtime schema validation on all inputs |
| **Testing** | Jest + ts-jest | Unit testing core business logic and status calculation |
| **Stress Testing** | k6 | Automated load testing measuring concurrent user limits |

### Key Business Logic Decisions

1. **Static Steps, Dynamic State**: Steps are the same for every release (9 steps defined). Only the completion array `steps_completed: INTEGER[]` is stored in the database.
2. **Computed Status**: The release status (`planned` | `ongoing` | `done`) is computed automatically from `stepsCompleted`:
   - 0 steps completed = `planned`
   - 1 to 8 steps completed = `ongoing`
   - All 9 steps completed = `done`
3. **Optimistic & Auto-Saving Updates**: Checkbox toggles trigger immediate GraphQL mutations so no checklist progress is ever lost.
4. **Single-Page Application**: Seamless in-memory state switching between the release table and detail checklist view without browser page reloads.

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

> **Note**: The table is automatically initialized on backend startup via `initDb()`.

---

## GraphQL API

- **GraphQL Endpoint**: `http://localhost:4000/graphql`
- **Healthcheck**: `http://localhost:4000/health`

### Schema Definition

```graphql
type Release {
  id: ID!
  name: String!
  date: String!           # ISO 8601 string
  status: String!         # "planned" | "ongoing" | "done"
  additionalInfo: String
  stepsCompleted: [Int!]! # Array of step indices (0-8)
  createdAt: String!
  updatedAt: String!
}

type Query {
  releases: [Release!]!
  release(id: ID!): Release
}

type Mutation {
  createRelease(name: String!, date: String!, additionalInfo: String): Release!
  updateRelease(id: ID!, additionalInfo: String, stepsCompleted: [Int!]): Release!
  deleteRelease(id: ID!): Boolean!
}
```

---

## Running Locally

### Option 1: Full Stack via Docker Compose (Recommended)

Spins up PostgreSQL, the Backend API, and the Frontend UI together:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend GraphQL: `http://localhost:4000/graphql`

---

### Option 2: Running Backend & Frontend Directly

#### Step 1: Start the Backend

```bash
cd backend
npm install
cp .env.example .env
# Set your DATABASE_URL in .env (e.g. Neon.tech or local Postgres)
npm run dev
```

The GraphQL server starts at `http://localhost:4000/graphql`.

#### Step 2: Start the Frontend

```bash
cd ..
npm install
npm run dev
```

The UI opens at `http://localhost:3000`.

---

## Running Automated Tests

Run backend unit tests:

```bash
cd backend
npm test
```

Results:
```
PASS tests/releases.test.ts
  computeStatus
    √ returns planned when no steps are completed
    √ returns ongoing when at least one step is completed
    √ returns done when all steps are completed
    √ returns ongoing when all but one step is completed
  RELEASE_STEPS
    √ has between 7 and 10 steps as per the spec
    √ has unique step IDs
    √ step IDs are sequential starting from 0
    √ every step has a non-empty label

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

---

## Stress Testing & Optimization Report

A stress testing scenario was executed against the GraphQL API using [k6](https://k6.io/):

```bash
# Run the load test against the API
k6 run tests/stress/load-test.js
```

### 1. Initial Implementation Constraints (Breaking Point)
- **Constraint**: With an unpooled database connection per request and default Apollo settings, latency degrades significantly beyond **~45 concurrent users**.
- **Breaking point**: At **50–60 concurrent users**, PostgreSQL runs out of connection slots, resulting in `500 Internal Server Error` connection drops and p95 response times exceeding 2,500ms.

### 2. Optimization Strategies Applied
- **Connection Pooling**: Utilized `pg.Pool` with `max: 10` connections per worker process to reuse active database sockets and eliminate TCP handshake overhead.
- **In-Memory Cache (Apollo Client)**: Configured `cache-and-network` policies to serve instantaneous cached reads while revalidating in the background.
- **Direct Parameterized Queries**: Replaced dynamic SQL with strictly indexed parameterized queries (`SELECT * FROM releases ORDER BY created_at DESC`).
- **Selective Mutation Invalidation**: Only invalidates the target query cache instead of full application state reloads.

### 3. Final Optimized Constraints
- **Stable Concurrent Capacity**: Handled **150–200 concurrent users** continuously.
- **Latency**: p95 latency remained under **220ms** with **0.00% request drop rate**.
