# Hydro_Grid

Smart hydroponic management system for monitoring crops and IoT sensor nodes across greenhouses.

Built with the MERN stack: **MongoDB**, **Express**, **React** (Vite + Tailwind CSS) and **Node.js**, plus a virtual IoT node that streams sensor telemetry.

## Project structure

```
Hydro_Grid/
├── backend/            Express REST API
│   ├── controllers/    Request handlers
│   ├── middleware/     JWT authentication
│   ├── models/         Mongoose schemas (User, Plant, Sensor)
│   ├── routes/         API route definitions
│   └── scripts/        Virtual IoT node simulator
└── frontend/           React + Vite single-page app
    └── src/
        ├── api/        Axios client
        └── components/ Auth and dashboard UI
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

3. **Run the app** (two terminals)

   ```bash
   npm run dev:backend
   ```

   ```bash
   npm run dev:frontend
   ```

   - Frontend: http://localhost:5173
   - API: http://localhost:5000/api (health check: `/api/health`)

4. **Start the virtual IoT node** (optional, third terminal)

   ```bash
   npm run simulate
   ```

## API overview

| Method | Endpoint                  | Auth     | Description                    |
| ------ | ------------------------- | -------- | ------------------------------ |
| GET    | `/api/health`             | Public   | Server and database status     |
| POST   | `/api/auth/register`      | Public   | Create a user account          |
| POST   | `/api/auth/login`         | Public   | Log in and receive a JWT       |
| GET    | `/api/plants`             | Public   | List crop systems              |
| POST   | `/api/plants`             | JWT      | Create a crop system           |
| GET    | `/api/sensors`            | Public   | List latest sensor readings    |
| POST   | `/api/sensors/telemetry`  | Public   | Ingest IoT telemetry           |

## Development workflow

- `main` always holds working code.
- New work happens on short-lived branches named by type:
  `feature/...`, `fix/...`, `chore/...`, `docs/...`
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:` ...).
- Branches are merged into `main` through pull requests.

## Roadmap

- [x] Project setup and cleanup
- [ ] Authentication (login, registration, protected routes)
- [ ] Plant management (full CRUD with validation)
- [ ] Greenhouse management
- [ ] Multi-sensor IoT telemetry with history charts
- [ ] Security hardening (roles, device API keys, rate limiting)
- [ ] Docker and CI/CD deployment
