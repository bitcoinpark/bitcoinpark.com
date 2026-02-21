# Mission Control Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mission Control                          │
│                  Task Management Dashboard POC                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│   Human Users    │          │   AI Agents/     │
│   (Web Browser)  │          │     Bots         │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         │ WebSocket                   │ HTTP/REST
         │ (Convex Subscriptions)      │
         │                             │
         ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌──────────────────┐                 ┌──────────────────┐      │
│  │   Next.js App    │                 │   HTTP API       │      │
│  │   Router (UI)    │                 │   (convex/http)  │      │
│  │                  │                 │                  │      │
│  │  - Task Board    │                 │  GET  /api/tasks │      │
│  │  - Task Detail   │                 │  POST /api/tasks │      │
│  │  - Comments      │                 │  PATCH /api/...  │      │
│  └──────────────────┘                 └──────────────────┘      │
│           │                                     │                │
│           └─────────────────┬───────────────────┘                │
│                             ▼                                    │
│                   ┌──────────────────┐                          │
│                   │ Convex Client    │                          │
│                   │ (ConvexProvider) │                          │
│                   └──────────────────┘                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Convex Backend (Cloud)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Convex Functions                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ tasks.ts     │  │ comments.ts  │  │  http.ts     │   │  │
│  │  │              │  │              │  │              │   │  │
│  │  │ - list()     │  │ - create()   │  │ - API Routes │   │  │
│  │  │ - get()      │  │ - list()     │  │              │   │  │
│  │  │ - create()   │  │              │  │              │   │  │
│  │  │ - update()   │  │              │  │              │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Convex Database                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │  users   │  │  tasks   │  │ comments │               │  │
│  │  │          │  │          │  │          │               │  │
│  │  │ - name   │  │ - title  │  │ - taskId │               │  │
│  │  │ - type   │  │ - status │  │ - author │               │  │
│  │  │          │  │ - assign │  │ - content│               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Human User Flow (Web UI)

```
User Action → Next.js Component → Convex Hook (useQuery/useMutation)
     ↓
Convex Function (query/mutation) → Database
     ↓
Real-time Update → WebSocket → UI Auto-Updates
```

**Example: Updating Task Status**
1. User clicks "In Progress" button
2. Component calls `useMutation(api.tasks.update)`
3. Convex executes `tasks.update()` mutation
4. Database updates task record
5. All subscribed clients receive update via WebSocket
6. UI re-renders with new status

### 2. AI Agent Flow (HTTP API)

```
Agent HTTP Request → Convex HTTP Router → Convex Action
     ↓
Convex Function (mutation/query) → Database
     ↓
HTTP Response → Agent
```

**Example: Creating Task via CLI**
1. Agent runs `python agent_cli.py create "Title" "Description"`
2. Script sends `POST /api/tasks` with JSON payload
3. Convex HTTP handler receives request
4. Calls `api.tasks.create()` mutation
5. Database inserts new task record
6. Returns task ID to agent
7. Web UI users see new task appear instantly

## Component Hierarchy

### Frontend (Next.js)

```
app/
├── layout.tsx (Root)
│   └── ConvexClientProvider
│       └── {children}
│
├── page.tsx (Home)
│   └── TaskBoard
│       └── TaskCard (×N)
│
└── tasks/[id]/page.tsx (Detail)
    ├── Task Info
    ├── Status Buttons
    └── CommentList
        └── Comment Form
```

### Backend (Convex)

```
convex/
├── schema.ts          → Defines database tables
├── tasks.ts           → Task CRUD operations
│   ├── list()         → Query: Get all tasks
│   ├── get()          → Query: Get single task
│   ├── create()       → Mutation: Create task
│   └── update()       → Mutation: Update task
│
├── comments.ts        → Comment operations
│   ├── create()       → Mutation: Add comment
│   └── list()         → Query: Get task comments
│
└── http.ts            → HTTP API routes
    ├── GET /api/tasks
    ├── POST /api/tasks
    ├── GET /api/tasks/{id}
    ├── PATCH /api/tasks/{id}
    └── POST /api/tasks/{id}/comments
```

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐
│    users     │
│──────────────│
│ _id          │◄───────┐
│ name         │        │
│ type         │        │
│ createdAt    │        │
└──────────────┘        │
                        │
         ┌──────────────┴──────────────┐
         │                             │
         │                             │
    ┌────┴───────────┐         ┌───────┴──────┐
    │     tasks      │         │   comments   │
    │────────────────│         │──────────────│
    │ _id            │◄────────│ _id          │
    │ title          │         │ taskId       │
    │ description    │         │ authorId     │────┐
    │ status         │         │ content      │    │
    │ priority       │         │ createdAt    │    │
    │ dueDate        │         └──────────────┘    │
    │ assignedTo     │──┐                          │
    │ createdBy      │──┼──────────────────────────┘
    │ createdAt      │  │
    │ updatedAt      │  │
    └────────────────┘  │
                        │
                        └─► References users table
```

### Relationships

- **tasks.createdBy** → users._id (required)
- **tasks.assignedTo** → users._id (optional)
- **comments.taskId** → tasks._id (required)
- **comments.authorId** → users._id (required)

### Indexes

```
tasks:
  - by_status: [status]
  - by_assignee: [assignedTo]

comments:
  - by_task: [taskId]
```

## API Contract

### Task Object

```typescript
{
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: number;  // Unix timestamp
  assignedTo?: {
    _id: string;
    name: string;
    type: "human" | "agent";
  };
  createdBy: {
    _id: string;
    name: string;
    type: "human" | "agent";
  };
  createdAt: number;
  updatedAt: number;
}
```

### Comment Object

```typescript
{
  _id: string;
  taskId: string;
  content: string;
  author: {
    _id: string;
    name: string;
    type: "human" | "agent";
  };
  createdAt: number;
}
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 | React framework with App Router |
| | React 19 | UI library |
| | TypeScript | Type safety |
| | Tailwind CSS | Styling |
| **Backend** | Convex | Serverless functions + database |
| | Convex HTTP | REST API for agents |
| **Real-time** | Convex Subscriptions | WebSocket-based live updates |
| **CLI** | Python | Agent command-line interface |
| **API Client** | requests | HTTP client for Python CLI |

## Deployment

```
Development:
├── Convex Dev Server (npx convex dev)
└── Next.js Dev Server (npm run dev)

Production:
├── Convex Cloud (automatic deployment)
└── Vercel (Next.js hosting)
    └── Environment Variables
        └── NEXT_PUBLIC_CONVEX_URL
```

## Security Model (POC)

⚠️ **Current POC**: No authentication

**Planned for Production:**
- Convex Auth for web users
- API keys for agents/bots
- Row-level security rules
- Rate limiting on HTTP endpoints

## Performance Characteristics

### Database Queries
- **list()**: O(n) - scans all tasks
- **get()**: O(1) - direct lookup by ID
- **Comments by task**: O(log n) - indexed lookup

### Real-time Updates
- Automatic via Convex subscriptions
- No polling required
- Sub-100ms update latency

### API Performance
- HTTP routes: ~50-200ms response time
- WebSocket updates: <100ms
- Suitable for 100s of concurrent users

## Future Architecture Enhancements

### Phase 2
- [ ] Authentication (Convex Auth)
- [ ] API keys for agents
- [ ] Activity logging table
- [ ] File attachments (Convex Storage)

### Phase 3
- [ ] Search (full-text indexes)
- [ ] Real-time collaboration cursors
- [ ] Webhooks for external integrations
- [ ] Analytics dashboard

### Phase 4
- [ ] Multi-workspace support
- [ ] Advanced permissions (RBAC)
- [ ] Third-party integrations (Slack, GitHub)
- [ ] Mobile app (React Native)
