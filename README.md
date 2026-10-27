# Hydro_Grid

Multi-company platform for Sri Lankan hydroponic farming companies to monitor crops, greenhouses and IoT sensor nodes.

Built with the MERN stack: **MongoDB**, **Express**, **React** (Vite + Tailwind CSS) and **Node.js**, plus a virtual IoT node that streams sensor telemetry.

Designed for Sri Lanka: the interface is available in **English and Sinhala**, shows times in **Sri Lanka time (Asia/Colombo)**, prices in **LKR**, and uses a bright greenhouse and tea-country visual style.

## Features

- **Multi-company workspaces** – each farming company gets its own private workspace; users, crops and sensors of one company are never visible to another
- **Company sign-up with plans** – a 14-day free trial or the Starter, Growth and Enterprise plans (monthly or yearly); new companies are reviewed by the platform admin
- **Platform admin** – approves, rejects, suspends and reactivates companies and sees platform totals
- **Staff access requests** – staff choose their company and request access; that company's admin approves the request and assigns a role
- **Company roles** – Admin, Farm Manager, Field Officer
- **English / Sinhala** – switch any time; each user's preferred language is remembered
- **Live dashboard** – crop systems and IoT telemetry refreshed every few seconds, with the signed-in company shown in the header
- **Greenhouses with district codes** – each greenhouse gets a permanent code from its district and number, e.g. **Nuwara Eliya GH-01**, **Badulla GH-01**, plus a plain name, growing system (NFT, deep water culture, grow bags, ebb and flow, vertical towers), main crop, area and status; removed greenhouses are archived so codes are never reused
- **Staff per greenhouse** – company admins see everything; farm managers and field officers only see the greenhouses (and their sensors) assigned to them
- **Ten hydroponic sensors per node** – water temperature, pH, EC (nutrients), dissolved oxygen, reservoir level, air temperature, humidity, light, CO₂ and grow-bag moisture
- **Farmer advice** – every reading is judged against crop-specific targets; problems appear in an "Action needed" list with why it matters and numbered steps to fix it (e.g. "Reservoir is running low → top up with clean water, check for leaks, re-check pH and EC"), in English and Sinhala
- **Farm health score and history charts** – a 0–100 health score per node and farm, and 6-hour / 24-hour / 7-day charts with the target band shaded
- **Crop profiles** – lettuce, tomato, strawberry, bell pepper, cucumber and local leafy greens (kankun, gotukola, mukunuwenna), each with its own pH, EC and temperature targets

## Sensors and targets

| Sensor            | Unit      | Default target | Notes                                  |
| ----------------- | --------- | -------------- | -------------------------------------- |
| Water temperature | °C        | 18 – 24        | Warm water holds less oxygen           |
| pH                | pH        | 5.5 – 6.5      | Crop specific                          |
| Nutrients (EC)    | mS/cm     | 1.0 – 1.6      | Crop specific (lettuce 0.8 – 1.2, tomato 2.0 – 3.5) |
| Dissolved oxygen  | mg/L      | above 6        | Drops when the air pump fails          |
| Reservoir level   | %         | above 40       |                                        |
| Air temperature   | °C        | 18 – 28        | Crop specific                          |
| Humidity          | %         | 50 – 75        |                                        |
| Light             | µmol/m²/s | 200 – 700      | Judged only between 7 AM and 6 PM (Sri Lanka time) |
| CO₂               | ppm       | 400 – 1200     |                                        |
| Grow bag moisture | %         | 40 – 70        | For coco peat / grow-bag systems       |

Targets live in `backend/config/metrics.js` and `backend/config/crops.js`; the advisor is `backend/services/advisor.js`. They follow general hydroponic guidance and should be tuned with an agronomist for each farm.

## Plans

| Plan       | Price (LKR)        | Greenhouses | Users     | Sensor nodes |
| ---------- | ------------------ | ----------- | --------- | ------------ |
| Free trial | Free for 14 days   | 1           | 3         | 5            |
| Starter    | Rs. 4,900 / month  | 2           | 5         | 10           |
| Growth     | Rs. 14,900 / month | 10          | 25        | 50           |
| Enterprise | Rs. 39,900 / month | Unlimited   | Unlimited | Unlimited    |

Yearly billing costs 10 × the monthly price (2 months free). Plans are defined in `backend/config/plans.js`.

## Project structure

```
Hydro_Grid/
├── backend/            Express REST API
│   ├── config/         Plans and supported districts
│   ├── controllers/    Request handlers
│   ├── middleware/     JWT authentication and role guards
│   ├── models/         Mongoose schemas (Company, User, Plant, Sensor)
│   ├── routes/         API route definitions
│   ├── scripts/        Platform admin setup, migrations, virtual IoT node
│   └── utils/          Shared validators
└── frontend/           React + Vite single-page app
    └── src/
        ├── api/        Axios client
        ├── assets/     Photos (credits in assets/photos/CREDITS.md)
        ├── components/ Layout, auth and shared UI
        ├── context/    Auth session state
        ├── hooks/      Data hooks (company picker)
        ├── i18n/       English and Sinhala translations
        ├── pages/      Login, sign-up, dashboard, users, platform
        └── utils/      Formatting, validation and role helpers
```

## Prerequisites

- Node.js 20 or newer
- A MongoDB Atlas cluster (transactions are used for company sign-up, so a replica set is required)

## Getting started

1. **Install dependencies**

   ```bash
   npm run install:all
   ```

2. **Configure the backend**

   Copy `backend/.env.example` to `backend/.env` and fill in your MongoDB connection string and a JWT secret.

3. **Create the platform administrator**

   ```bash
   npm run create-platform-admin
   ```

   You are asked for a name, email, optional Sri Lankan mobile number and a password (typed hidden). Log in by choosing **Hydro_Grid platform** as the company.

4. **Run the app** (two terminals)

   ```bash
   npm run dev:backend
   ```

   ```bash
   npm run dev:frontend
   ```

   - Frontend: http://localhost:5173
   - API: http://localhost:5000/api (health check: `/api/health`)

5. **Add companies**: register one on the login page (**Register your company**) and approve it as the platform admin, or build the full demo from `backend/scripts/demo-data.json`:

   ```bash
   npm run setup-demo
   ```

   This creates Agri Lanka (Pvt) Ltd and Green Farmers (Pvt) Ltd (already approved) with role-based demo staff (`admin@agrilanka.test`, `manager@agrilanka.test`, `officer1@agrilanka.test`, … `officer@greenfarmers.test`), greenhouses with assigned staff, one sensor node per greenhouse with 24 hours of readings, and crop records. All demo accounts share the password in `DEMO_PASSWORD` (backend/.env), or the one you type when asked. It prints the simulator command for each company.

6. **Start virtual IoT nodes** for a company (optional, third terminal)

   ```bash
   npm run simulate -- <companyId> 2 10
   ```

   Starts 2 nodes reporting every 10 seconds. The simulator follows Sri Lanka time (warm afternoons, humid nights), drifts reservoir level, pH and EC faster than real life so advice appears within minutes, and occasionally simulates an air-pump failure. The company id is shown on the dashboard when no nodes are reporting yet.

### Upgrading an existing database

Run migrations in order from the `backend` folder:

```bash
node scripts/migrations/001-sensor-ids-per-company.js
```

## API overview

Authenticated requests send `Authorization: Bearer <token>`. Errors return a machine-readable `code` (for example `COMPANY_PENDING`) that the UI translates.

| Method | Endpoint                                   | Auth           | Description                                        |
| ------ | ------------------------------------------ | -------------- | -------------------------------------------------- |
| GET    | `/api/health`                              | Public         | Server and database status                         |
| GET    | `/api/companies/options`                   | Public         | Plans, billing cycles and districts                |
| GET    | `/api/companies`                           | Public         | Active companies (for the company picker)          |
| POST   | `/api/companies/register`                  | Public         | Register a company and its admin (pending review)  |
| POST   | `/api/auth/register`                       | Public         | Request access to a company (pending approval)     |
| POST   | `/api/auth/login`                          | Public         | Log in to a company or the platform, returns a JWT |
| GET    | `/api/auth/me`                             | User           | Current user's profile and company                  |
| PATCH  | `/api/auth/me`                             | User           | Update own name, phone or language                 |
| GET    | `/api/users?status=`                       | Company admin  | List the company's users                           |
| PATCH  | `/api/users/:id/approve`                   | Company admin  | Approve a pending account with a role              |
| PATCH  | `/api/users/:id/reject`                    | Company admin  | Reject a pending account                           |
| PATCH  | `/api/users/:id`                           | Company admin  | Change role, disable or re-enable                  |
| GET    | `/api/greenhouses/options`                 | Company user   | Districts, systems, next code per district, plan usage |
| GET    | `/api/greenhouses`                         | Company user   | Visible greenhouses with sensor and health summary |
| POST   | `/api/greenhouses`                         | Company admin  | Add a greenhouse (code assigned automatically)     |
| GET    | `/api/greenhouses/:id`                     | Company user   | Greenhouse with staff, nodes and advice            |
| PATCH  | `/api/greenhouses/:id`                     | Admin, manager | Edit name, system, crop, area, status, notes       |
| PUT    | `/api/greenhouses/:id/staff`               | Company admin  | Assign farm managers and field officers            |
| DELETE | `/api/greenhouses/:id`                     | Company admin  | Archive a greenhouse without sensor nodes          |
| GET    | `/api/plants`                              | Company user   | List the company's crop systems                    |
| POST   | `/api/plants`                              | Admin, manager | Create a crop system                               |
| POST   | `/api/telemetry`                           | Devices        | Ingest a batch of readings from one node           |
| GET    | `/api/telemetry/options`                   | Company user   | Metric units and crop target bands                 |
| GET    | `/api/telemetry/nodes?greenhouse=`         | Company user   | Visible nodes with readings, advice and health     |
| GET    | `/api/telemetry/nodes/:nodeId/history`     | Company user   | Averaged history for charts (`?hours=6/24/168`)    |
| PATCH  | `/api/telemetry/nodes/:nodeId`             | Admin, manager | Set node name, location, crop profile, greenhouse  |
| GET    | `/api/platform/summary`                    | Platform admin | Companies by status and plan, user total           |
| GET    | `/api/platform/companies?status=`          | Platform admin | Companies with admin contact and staff count       |
| PATCH  | `/api/platform/companies/:id/approve`      | Platform admin | Activate a company (starts a trial)                |
| PATCH  | `/api/platform/companies/:id/reject`       | Platform admin | Reject a pending company                           |
| PATCH  | `/api/platform/companies/:id/suspend`      | Platform admin | Suspend an active company                          |
| PATCH  | `/api/platform/companies/:id/reactivate`   | Platform admin | Reactivate a suspended company                     |

## Development workflow

- `main` always holds working code.
- New work happens on short-lived branches named by type:
  `feature/...`, `fix/...`, `chore/...`, `docs/...`
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:` ...).
- Branches are merged into `main` through pull requests.

## Roadmap

- [x] Project setup and cleanup
- [x] Authentication (login, registration with admin approval, roles, English/Sinhala)
- [x] Photo-based UI redesign
- [x] Multi-company workspaces, plans and platform admin
- [ ] Subscription payments (PayHere sandbox), trial expiry and plan limits
- [x] Greenhouse management (e.g. "Nuwara Eliya GH-01") with staff assignment
- [ ] Plant management (full CRUD with validation)
- [x] Multi-sensor IoT telemetry with farmer advice, health score and history charts
- [ ] Security hardening (device API keys, rate limiting)
- [ ] Automated tests, Docker and CI/CD deployment
