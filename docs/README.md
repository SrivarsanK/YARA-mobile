# YARA Mobile

> Smart India Hackathon (SIH) 2026 — Public Transit Intelligence Platform
> React Native monorepo for the YARA mobile experience.

---

## What's in this Repo

| Package | Description |
|---|---|
| `packages/user-app` | **YARA User App** — Passenger-facing: live ETA map, route search, nearby stops, kiosk display |
| `packages/admin-app` | **YARA Admin App** — Operator/judge: fault injection, fleet control, scenario runner, Neon DB inspector |
| `packages/shared` | **Shared library** — Types, constants, hooks, components shared between both apps |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 22.12.0 |
| npm | ≥ 10.x |
| Expo CLI | `npm install -g expo-cli` |
| EAS CLI | `npm install -g eas-cli` |
| Android Studio / Xcode | For device builds |
| Expo Go (phone) | For instant dev preview |

### Backend (from [SIH-inthack-2026](https://github.com/SrivarsanK/SIH-inthack-2026))

The backend pipeline must be running before launching the app:

```bash
# In the parent repo
docker start mqtt-broker          # MQTT broker :1883
python simulator/control_api.py   # CH-1 :8001
python kalman_service/subscriber.py  # CH-2
python eta_engine/api.py          # CH-3 :8002
```

Or single command: `python run_local.py`

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/SrivarsanK/yara-mobile.git
cd yara-mobile

# 2. Configure backend URLs (find your LAN IP first)
cp .env.example .env.local
# Edit: EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:8002
# Edit: EXPO_PUBLIC_SIM_URL=http://<YOUR_LAN_IP>:8001

# 3. Install all packages (monorepo)
npm install

# 4. Launch User App
cd packages/user-app
npx expo start

# 5. Launch Admin App (separate terminal)
cd packages/admin-app
npx expo start --port 8082
```

Scan the QR code with **Expo Go** on your phone (same WiFi as your dev machine).

---

## Environment Variables

Copy `.env.example` to `.env.local` in each app package:

```bash
# .env.example
EXPO_PUBLIC_API_URL=http://192.168.1.100:8002    # CH-3 ETA Engine
EXPO_PUBLIC_SIM_URL=http://192.168.1.100:8001    # CH-1 Simulator Control
```

> **For the demo**: Set these to the machine running `run_local.py` on the same WiFi network.

---

## Project Structure

```
yara-mobile/
├── AGENTS.md                   # Agentic workflow — orchestrator + worker instructions
├── README.md                   # This file
├── .env.example                # Environment variable template
├── package.json                # Workspace root
│
├── packages/
│   ├── shared/                 # @yara/shared — types, constants, hooks, components
│   │   ├── lib/
│   │   │   ├── types.ts        # 🔒 All TypeScript interfaces (LOCKED CONTRACT)
│   │   │   ├── constants.ts    # 🔒 API URLs, numeric constants (LOCKED CONTRACT)
│   │   │   └── agencies.ts     # Agency presets (MTC Chennai, CMRL, BMTC, KSRTC)
│   │   ├── hooks/
│   │   │   ├── useTransitStream.ts  # SSE consumer → TransitSnapshot
│   │   │   └── useNeonRoutes.ts     # REST client → routes, stops
│   │   ├── components/         # Shared UI primitives
│   │   └── services/
│   │       ├── api.ts          # All REST endpoints
│   │       └── sse.ts          # SSE connection manager
│   │
│   ├── user-app/               # YARA User App
│   │   └── src/
│   │       ├── navigation/     # Tab + Stack navigators
│   │       ├── screens/        # Overview, LiveMap, TrackBus, Routes, Search, Kiosk
│   │       ├── components/     # App-specific components
│   │       ├── context/        # TransitContext, RoutesContext
│   │       └── theme/          # Colors, typography, spacing
│   │
│   └── admin-app/              # YARA Admin App
│       └── src/
│           ├── navigation/
│           ├── screens/        # Dashboard, Inject, Fleet, Scenarios, Database
│           ├── components/
│           └── context/        # AdminContext (vehicle state, inject history)
│
└── docs/
    ├── PRD.md                  # Product Requirements Document
    ├── ARCHITECTURE.md         # System architecture + data flow
    ├── DESIGN.md               # Design system + screen wireframes
    └── TECH_STACK.md           # Stack, dependencies, implementation patterns
```

---

## Backend API Reference

### CH-3 ETA Engine (`:8002`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/stream` | **SSE stream** — `TransitSnapshot` JSON every 1 second |
| GET | `/eta` | One-shot snapshot |
| GET | `/api/routes?page=1&limit=50` | Paginated route list |
| GET | `/api/routes/search?q=S26` | Route search (returns both directions) |
| GET | `/api/routes/{id}/stops?direction=0` | Ordered stop list |
| GET | `/api/stops/search?q=broadway` | Stop name search |
| GET | `/api/stops/nearby?lat=13.03&lon=80.18&limit=5` | Nearest stops + upcoming buses |
| GET | `/model/info` | ML model metadata (MAE, R²) |

### CH-1 Simulator Control (`:8001`)

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| GET | `/health` | — | Pipeline health check |
| GET | `/vehicles` | — | All vehicle telemetry |
| POST | `/vehicles/{id}/delay` | `{ "seconds": 300 }` | Inject 5-min delay |
| POST | `/vehicles/{id}/gnss-dropout` | `{ "duration_s": 10 }` | Simulate GPS loss |
| POST | `/vehicles/{id}/crowd-spike` | `{ "band": "STANDING_ROOM_ONLY", "duration_s": 30 }` | Simulate crowd surge |

---

## Agentic Build Workflow

This project is built by an **agentic team**:

- 🧠 **Orchestrator** — Opencode: phases work, reviews feature branches, merges to integration, creates final PR
- ⚡ **Workers** — Antigravity CLI (4 simultaneous): Worker A (screens), Worker B (data layer), Worker C (admin app), Worker D (components/design)

**Full workflow defined in [`AGENTS.md`](./AGENTS.md).**

### Branch Flow

```
phase-N/<feature>  →  integration/mobile-app  →  main
                         (Opencode reviews)    (srivarsank reviews)
```

- Feature branches PR into `integration/mobile-app` (reviewed by Opencode)
- Only `integration/mobile-app` PRs into `main` (reviewed and merged by **srivarsank only**)
- **Never push to `main` directly**

### Git Branch Protection (set in GitHub repo settings)

| Branch | Rule |
|---|---|
| `main` | Require PR, require review from `srivarsank`, no force push, no direct push |
| `integration/mobile-app` | Require PR from feature branches, no direct push |

---

## Demo Checklist (Judge Evaluation)

Run on a physical Android/iOS device, with backend pipeline running:

- [ ] Bus visible on map moving in real-time
- [ ] Outbound bus shows "Completing prior route" with live inbound ETA
- [ ] Admin App: Inject Delay → User App countdown jumps within 2 seconds
- [ ] Admin App: Inject GNSS Dropout → User App map path stays smooth (no teleport)
- [ ] Admin App: Inject Crowd Spike → User App occupancy badge changes color
- [ ] Event log shows cause → effect from single button press
- [ ] All four ETA numbers change from one inject (pipeline is connected)
- [ ] Kiosk screen fullscreen on tablet — outdoor-readable

---

## Build for Release

```bash
# Android APK
cd packages/user-app
eas build --platform android --profile production

# iOS (requires Apple Developer account)
eas build --platform ios --profile production

# OTA update (no rebuild needed)
eas update --branch production --message "ETA fix"
```

---

## Locked Contracts

These values are **immutable** — sourced from the parent repo's `shared/constants.py`:

| Constant | Value | Meaning |
|---|---|---|
| `BUS_CAPACITY` | `40` | Seated capacity |
| `BUS_MAX_CAPACITY` | `55` | Absolute max (standing) |
| `OUTBOUND_TOTAL_SEC` | `1500` | 25-minute outbound leg |
| `INBOUND_TOTAL_SEC` | `1500` | 25-minute inbound leg |
| `DWELL_BASELINE_SEC` | `300` | 5-minute default halt |
| `BLOCK_ID` | `"block_001"` | Primary vehicle block |

---

## License

SIH 2026 Hackathon Build — Team YARA
