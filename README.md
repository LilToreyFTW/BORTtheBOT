# BORTtheBOT: Distributed Laser Printer Control System

BORTtheBOT is a monorepo software suite for controlling, monitoring, and simulating a distributed array of robotic laser arms, typically used to drive customized 3D laser sintering or additive manufacturing hardware. It integrates a high-performance backend API, a realtime web frontend, secure authentication, a modular database, and a robust calibration/viewer interface—all optimized for robotics and laboratory environments.

---

## Key Features

- **Distributed Laser Arm Control:** Coordinate multiple robotic laser arms for simultaneous tasks or complex scan patterns.
- **Realtime 3D Viewer:** Visualize each printer, laser paths, calibration, and live motion using a browser-based, GPU-accelerated viewer.
- **REST & tRPC API:** Expose secure endpoints for job submission, status, telemetry, and configuration.
- **Multi-User Authentication:** Fine-grained roles (operator, admin, guest) using secure authentication.
- **Persistent Storage:** Store job specs, part files, calibration data, and logs using Drizzle ORM with SQLite or Turso backend.
- **Cross-platform/Headless Operation:** Native binaries and scripts for Windows (via batch), Unix, and Bun runtime.
- **Hot Reload & Dev Tools:** Fast iteration with Bun, TypeScript, and instant reload for both frontend and backend.
- **Monorepo Structure:** Maintains all code, database, and core logic in a coherent and manageable Turborepo/multi-package structure.

---

## Getting Started

### 1. Install system dependencies

- [Bun](https://bun.sh/) (latest version)
- [Node.js](https://nodejs.org/) (optional, for some CLI tools)
- [Git](https://git-scm.com/)

### 2. Install project dependencies

```bash
bun install
```

### 3. Configure Environment

Copy and edit example `.env` files in `apps/server/` and `apps/web/` as needed. Key settings include:

- `PORT` and `HOST`
- `BOT_STORAGE_DIR`
- `DATABASE_URL` (for SQLite/Turso)

### 4. Initialize and Migrate Database

```bash
cd apps/server
bun db:local         # Start the SQLite database
bun db:push          # Apply latest schema migrations
```

### 5. Start the System in Development Mode

```bash
bun dev
```

- **Frontend:** [http://localhost:3001](http://localhost:3001)
- **API/Backend:** [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
project/
├── apps/
│   ├── web/          # React-based frontend with 3D viewer and admin tools
│   └── server/       # Hono/TRPC backend API & server logic
├── packages/
│   ├── api/          # Core robotics/printing business logic
│   ├── auth/         # Secure authentication provider/config
│   └── db/           # Database schema, types, migrations
```

---

## Common Scripts

- `bun dev`           — Start backend and frontend in development mode
- `bun build`         — Build all apps for production
- `bun dev:web`       — Launch only the web UI
- `bun dev:server`    — Launch only the backend server & API
- `bun check-types`   — Run full TypeScript type-checking
- `bun db:push`       — Apply schema changes (Drizzle migration)
- `bun db:studio`     — Launch DB admin/studio UI
- `cd apps/server && bun db:local` — Start SQLite DB server (local mode)

---

## Deployment

To build a native, single-binary server (Windows):

```bash
cd apps/server
bun run bundle      # Bundles the Bun launcher for Bun runtime (.ts)
bun run compile     # Produces an .exe (Node.js based) via pkg
```

For UNIX deployments, use `bun run compile:unix` for a native binary.

---

## Usage Scenarios

- **Robotic 3D Printing:** Orchestrate up to 8 (or more) synchronized laser arms for custom 3D printing.
- **Research & Prototyping:** Modify core logic and see changes instantly—ideal for laboratory research setups.
- **Process Monitoring:** Use 3D viewer and live status APIs to monitor operations remotely.
- **Multi-user Collaboration:** Managed access for operators and admins via builtin authentication.

---

## Support & Customization

For issues, enhancements, or customized deployments (e.g. more arms, new hardware targets, alternate authentication, or cloud DBs), contact the project maintainer.

---

© 2024 BORTtheBOT Developers. All rights reserved.
