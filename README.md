# Hydro_Grid

Smart hydroponic management system for monitoring crops and IoT sensor nodes across greenhouses.

Built with the MERN stack: **MongoDB**, **Express**, **React** (Vite + Tailwind CSS) and **Node.js**, plus a virtual IoT node that streams sensor telemetry.

Designed for Sri Lankan growers: the interface is available in **English and Sinhala**, shows times in **Sri Lanka time (Asia/Colombo)** and uses a tea-estate inspired visual style.

## Features

- **Accounts with admin approval** – anyone can request access; an admin approves the request and assigns a role
- **Roles** – Admin, Farm Manager, Field Officer
- **Admin user management** – approve / reject requests, change roles, disable or re-enable accounts
- **English / Sinhala** – switch any time; each user's preferred language is remembered
- **Live dashboard** – crop systems and IoT telemetry refreshed every few seconds

## Project structure

```
Hydro_Grid/
├── backend/            Express REST API
│   ├── controllers/    Request handlers
│   ├── middleware/     JWT authentication and role guard
│   ├── models/         Mongoose schemas (User, Plant, Sensor)
│   ├── routes/         API route definitions
│   ├── scripts/        create-admin and virtual IoT node
│   └── utils/          Shared validators
└── frontend/           React + Vite single-page app
    └── src/
        ├── api/        Axios client
        ├── components/ Layout, auth and shared UI
        ├── context/    Auth session state
        ├── i18n/       English and Sinhala translations
        ├── pages/      Login, register, dashboard, users
        └── utils/      Formatting and validation helpers
```

## Prerequisites

- Node.js 20 or newer
- A MongoDB Atlas cluster (or a local MongoDB instance)

## Getting started

1. **Install dependencies**

   ```bash
   npm run install:all
   ```

2. **Configure the backend**

   Copy `backend/.env.example` to `backend/.env` and fill in your MongoDB connection string and a JWT secret.

3. **Create the first administrator**

   ```bash
   npm run create-admin
   ```

   You are asked for a name, email, optional Sri Lankan mobile number and a password (typed hidden).

4. **Run the app** (two terminals)

   ```bash
   npm run dev:backend
   ```

   ```bash
   npm run dev:frontend
   ```

   - Frontend: http://localhost:5173
   - API: http://localhost:5000/api (health check: `/api/health`)

5. **Start the virtual IoT node** (optional, third terminal)

   ```bash
   npm run simulate
   ```

## API overview

Authenticated requests send `Authorization: Bearer <token>`. Errors return a machine-readable `code` (for example `ACCOUNT_PENDING`) that the UI translates.

| Method | Endpoint                    | Auth   | Description                                  |
| ------ | --------------------------- | ------ | -------------------------------------------- |
| GET    | `/api/health`               | Public | Server and database status                   |
| POST   | `/api/auth/register`        | Public | Request an account (starts as pending)       |
| POST   | `/api/auth/login`           | Public | Log in (active accounts only), returns a JWT |
| GET    | `/api/auth/me`              | User   | Current user's profile                       |
| PATCH  | `/api/auth/me`              | User   | Update own name, phone or language           |
| GET    | `/api/users?status=`        | Admin  | List users, optionally by status             |
| PATCH  | `/api/users/:id/approve`    | Admin  | Approve a pending account with a role        |
| PATCH  | `/api/users/:id/reject`     | Admin  | Reject a pending account                     |
| PATCH  | `/api/users/:id`            | Admin  | Change role, disable or re-enable            |
| GET    | `/api/plants`               | User   | List crop systems                            |
| POST   | `/api/plants`               | User   | Create a crop system                         |
| GET    | `/api/sensors`              | User   | List latest sensor readings                  |
| POST   | `/api/sensors/telemetry`    | Public | Ingest IoT telemetry                         |

## Development workflow

- `main` always holds working code.
- New work happens on short-lived branches named by type:
  `feature/...`, `fix/...`, `chore/...`, `docs/...`
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:` ...).
- Branches are merged into `main` through pull requests.

## Roadmap

- [x] Project setup and cleanup
- [x] Authentication (login, registration with admin approval, roles, English/Sinhala)
- [ ] Plant management (full CRUD with validation)
- [ ] Greenhouse management
- [ ] Multi-sensor IoT telemetry with history charts
- [ ] Security hardening (roles, device API keys, rate limiting)
- [ ] Docker and CI/CD deployment
