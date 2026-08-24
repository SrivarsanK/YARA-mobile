# YARA Mobile

React Native monorepo for the YARA public transit intelligence platform (SIH 2026).

## Apps

- **packages/user-app** — YARA User App (passenger-facing)
- **packages/admin-app** — YARA Admin App (operator/judge-facing)

## Shared Package

- **packages/shared** — Types, constants, hooks, components, services, theme

## Quick Start

```bash
# Install dependencies
npm install

# Start user app
npm run user-app

# Start admin app
npm run admin-app

# Type check all packages
npm run typecheck
```

## Backend URLs

Configure via `.env.local`:

```bash
EXPO_PUBLIC_API_URL=http://<LAN_IP>:8002
EXPO_PUBLIC_SIM_URL=http://<LAN_IP>:8001
```

Find your LAN IP: `ipconfig | findstr "IPv4"` (Windows)

## Phase Plan

See [AGENTS.md](./AGENTS.md) for the complete 8-phase build plan.

## Demo Criteria

- Bus visible on map moving in real-time
- Outbound bus shows "Completing prior route" with live inbound ETA
- Inject Delay (Admin App) → User App countdown jumps within 2s
- Inject Dropout (Admin App) → User App map path stays smooth
- Inject Crowd (Admin App) → User App occupancy badge changes
- Event log shows cause → effect from single button press
- All four numbers change from one inject (pipeline is connected)
- Works on physical Android AND iOS device