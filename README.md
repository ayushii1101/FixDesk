# FixDesk – Office Maintenance & Complaints Management System

## Overview

FixDesk (also referenced as OMCMS in the application) is a web-based internal office maintenance and complaints management system. It enables employees to report office issues and helps managers track, assign, and resolve them efficiently with clear visibility into complaint status and history.

## Problem statement

Organizations need a simple, centralized way for employees to report facility/IT/electrical/plumbing/cleaning issues and for designated managers to triage, prioritize, assign to maintenance staff, update status, and record resolution remarks. FixDesk addresses this by providing role-based access with a clean, professional interface.

## Main features

- **Employee portal**
  - Secure login with role-based access
  - Dashboard with summary cards (Total, Pending, In Progress, Resolved)
  - Report a problem with category, problem type, location, description, and priority
  - View own complaints with filters (status/priority/category) and search by complaint ID
  - View complaint details including status, assignment, history, and resolution remarks
- **Manager portal**
  - Dashboard with summary cards and category overview
  - View all complaints with filtering by status, priority, category, date, and assigned staff
  - Manage complaints: change priority, assign maintenance staff, update status, add resolution remarks, mark as resolved
  - Manage maintenance staff list
- **Complaint tracking**
  - Three statuses: `PENDING`, `IN_PROGRESS`, `RESOLVED`
  - Priorities: `LOW`, `MEDIUM`, `HIGH`
  - Automatic complaint numbering and history tracking (submission, assignment, status/priority changes, resolution)
- **Data integrity & security**
  - Supabase Authentication with email/password
  - Role-based access control (EMPLOYEE, MANAGER)
  - Row Level Security (RLS) enforced on all tables
  - Secure session handling

## Technology stack

- **Frontend:** React 19, TypeScript, Vite 8, TanStack Start, TanStack Router, TanStack React Query
- **UI:** Tailwind CSS 4, shadcn/ui (Radix UI primitives), lucide-react
- **Backend/Services:** Supabase (Authentication, PostgreSQL with RLS)
- **Tooling:** ESLint, Prettier, TypeScript

## User roles

| Role | Permissions |
|---|---|
| `EMPLOYEE` | Login, report problems, view only their own complaints, track status, view assigned staff and resolution remarks |
| `MANAGER` | Login, view all complaints, manage complaints (assign staff, change priority/status), add resolution remarks, mark resolved, manage maintenance staff |

Maintenance staff do **not** have separate logins in this version; managers assign existing maintenance staff to complaints.

## Complaint workflow and statuses

**Workflow (typical):**
1. Employee logs in and reports a problem → Complaint created with status `PENDING`
2. Manager reviews complaint, assigns maintenance staff and/or changes priority → Status may become `IN_PROGRESS`
3. Manager adds resolution remarks and marks as resolved → Status becomes `RESOLVED` with `resolved_at` timestamp

**Statuses:**
- `PENDING` – Submitted, not yet started
- `IN_PROGRESS` – Assigned and work in progress
- `RESOLVED` – Resolved with remarks

**Priorities:** `LOW`, `MEDIUM`, `HIGH`

## Database and authentication overview

- **Authentication:** Supabase Auth (email/password). Sessions persisted in browser storage with auto-refresh.
- **Database:** PostgreSQL (Supabase) with tables for profiles, user_roles, categories, maintenance_staff, complaints, complaint_history.
- **Security:** RLS policies enforce data access by role and ownership. Triggers maintain complaint history automatically.
- **Migrations:** Schema and policies are defined in `supabase/migrations/`.

For full schema details, see `docs/project-specification.md`.

## Project structure

```
fixdesk/
├── docs/                    # Documentation (project specification, diagrams)
├── public/                  # Static assets (favicon, logo, robots)
├── src/
│   ├── components/         # Reusable components and UI primitives
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations (Supabase)
│   ├── lib/                # Utilities, auth, helpers
│   ├── routes/             # TanStack file-based routes
│   └── styles.css          # Global styles
├── supabase/
│   ├── config.toml         # Supabase project config
│   └── migrations/         # Database migrations
└── package.json
```

## Installation and setup

### Prerequisites
- Node.js (v18+ recommended)
- npm (or compatible package manager)
- A Supabase project with the schema from migrations applied

### Steps
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fixdesk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
     - `VITE_SUPABASE_URL` / `SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_PROJECT_ID` / `SUPABASE_PROJECT_ID`

4. **Set up database**
   - Apply the SQL migrations in `supabase/migrations/` to your Supabase project
   - Ensure RLS policies are enabled as defined in migrations

5. **Run the development server**
   ```bash
   npm run dev
   ```

The app will be available at the URL shown in your terminal (typically `http://localhost:3000`).

## Environment variable requirements

| Variable | Purpose | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (client-side) | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key (client-side) | Yes |
| `SUPABASE_URL` | Supabase project URL (server-side) | Yes |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key (server-side) | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID (optional metadata) | As configured |
| `SUPABASE_PROJECT_ID` | Supabase project ID (optional metadata) | As configured |

See `.env.example` for placeholders.

## Available npm scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with Vite |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Screenshots

*Screenshots not available in the repository. Add screenshots to `docs/screenshots/` and update this section as needed.*

## Documentation

- **Project specification:** `docs/project-specification.md` (original detailed requirements)
- **Diagrams:** `docs/diagrams/` (use case, architecture, ER, sequence diagrams)
