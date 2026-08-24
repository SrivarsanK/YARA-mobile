# Yara SIH 2026 — Codebase Reality Report

**Generated:** 2026-08-16  
**Purpose:** Document what actually works vs. what is mock/broken in the current codebase

---

## Executive Summary

The codebase implements a **4-channel transit intelligence pipeline** (Simulator → Kalman → ETA → Dashboard). However, **critical contract mismatches exist between channels** that will prevent end-to-end operation. The pipeline is ~60% real implementation, ~40% mock/placeholder/incompatible.

| Channel | Status | Key Issue |
|---------|--------|-----------|
| **CH-1 Simulator** | ⚠️ Partially Working | MQTT topic mismatch with CH-2; Control API endpoints don't match Dashboard InjectPanel |
| **CH-2 Kalman** | ✅ Real Implementation | Pure-Python Kalman filter works correctly; verified by `verify.py` |
| **CH-3 ETA Engine** | ⚠️ Partially Working | ML model trained & loads; GTFS data path missing; Neon DB integration real but untested |
| **CH-4 Dashboard** | ⚠️ Mostly Mock Data | SSE connects to CH-3 but shows mock buses/stops on map; InjectPanel calls wrong API endpoints |

---

## Channel-by-Channel Analysis

### CH-1: Simulator (`simulator/`)

**What's Real:**
- Full vehicle simulation engine with GTFS shape interpolation (`_densify`, `haversine`, `_interpolate_position`)
- State machine: EN_ROUTE → HOLD (injected delay) → DWELL → next leg
- GNSS dropout simulation with dead-reckoning drift
- Crowd spike injection overriding occupancy band
- MQTT publishing at configurable Hz (default 1Hz)
- Multi-vehicle, multi-block support with staggering

**What's Broken/Mismatched:**

| Issue | Detail | Impact |
|-------|--------|--------|
| **MQTT Topic Mismatch** | Simulator publishes to `transitsense/vehicle/{id}/telemetry` (default prefix `transitsense`) | CH-2 subscribes to `fleet/bus_1/telemetry` — **no messages received** |
| **Payload Contract Violation** | Simulator emits fields: `leg_state`, `percent_leg_complete`, `hold_remaining_s`, `schedule_deviation_s`, `gnss_dropout_remaining_s`, `crowd_spike_active` | CH-2 expects: `gnss_valid`, `mac_count_delta`, `event_flags.delay_min`, `event_flags.dropout`, `event_flags.crowd_spike`, `leg` (outbound/dwell/inbound), `progress` |
| **Control API Endpoint Mismatch** | Implements: `POST /vehicles/{id}/delay`, `POST /vehicles/{id}/gnss-dropout`, `POST /vehicles/{id}/crowd-spike` | Dashboard InjectPanel calls: `POST /inject/delay?min=5`, `POST /inject/dropout?sec=10`, `POST /inject/crowd?delta=20`, `POST /reset` |
| **Missing `/reset` Endpoint** | Not implemented in control_api.py | Dashboard Reset button does nothing |
| **No `mac_count_delta` in Telemetry** | Simulator never emits `mac_count_delta` field | CH-3 density aggregator receives zero deltas → always "SEATS_AVAILABLE" |

**Files:**
- `simulator.py` — 613 lines, real engine
- `control_api.py` — 214 lines, FastAPI wrapper (wrong endpoints)
- `AGENTS.md` — Documents **different** contract than code implements

---

### CH-2: Kalman Fusion (`kalman_service/`)

**What's Real:**
- Pure-Python zero-dependency Kalman filter (`KalmanTracker` class)
- State vector: `[lat, lon, v_lat, v_lon]` (position + velocity)
- Correct noise matrices: `R_gnss = 0.00001`, `R_cell = 0.05` (5000× ratio)
- Prediction + update steps implemented correctly
- Velocity damping during dropout (0.8× decay)
- Velocity clamping to prevent explosion
- `verify.py` unit test passes: max fused dlat during dropout < 0.0001°

**What's Broken/Mismatched:**
- Subscribes to `fleet/bus_1/telemetry` but CH-1 publishes to different topic
- Expects `gnss_valid` boolean; CH-1 sends no such field
- Expects `mac_count_delta`; CH-1 doesn't send it
- Passes through `block_id`, `leg`, `progress` — but CH-1 uses different field names (`leg_state`, `percent_leg_complete`)

**Files:**
- `kalman.py` — 173 lines, **real working implementation**
- `subscriber.py` — 74 lines, MQTT glue
- `verify.py` — 62 lines, **passes** (run it: `python verify.py`)

---

### CH-3: ETA Engine (`eta_engine/`)

**What's Real:**
- **ML Model Trained**: GradientBoostingRegressor (MAE 472s, R² 0.674) on 300K rows from Chennai MTC GTFS
- Model loads at startup via `eta_predictor.py` with graceful fallback to calculative formula
- GTFS loader (`gtfs_loader.py`) parses stop_times.txt (44MB) streaming, computes per-trip durations and direction medians
- Density aggregator: rolling 60s MAC window → occupancy bands (SEATS_AVAILABLE/MODERATE/STANDING_ROOM/VERY_CROWDED)
- ETA formula: `T_total = T_outbound + T_dwell + T_inbound` with dynamic dwell recovery
- Event log: records T_total changes > 30s, max 20 entries
- SSE endpoint at `/stream` pushes JSON every 1s with CORS
- Neon DB integration (`neon_client.py`) — full SQL queries for routes, stops, search, nearby

**What's Broken/Mismatched:**

| Issue | Detail | Impact |
|-------|--------|--------|
| **Missing GTFS Data Path** | `gtfs_loader.py` expects `eta_engine/Data_train_test/data/` — **directory does not exist** | ML predictor falls back to calculative; `/routes` endpoint returns empty |
| **Actual GTFS Data Location** | Data exists at `shared/data/unified/` (full) and `shared/data/cmrl-gtfs/` (subset) | Loader path needs fixing |
| **CH-2 Topic Mismatch** | Consumes `fleet/bus_1/fused` — but CH-2 never publishes because CH-1 topic wrong | State never updates; dashboard shows stale/mock data |
| **No `event_flags.delay_min` from CH-1** | Simulator doesn't emit this; delay accumulation never triggers | T_dwell never shrinks; recovery demo broken |
| **Neon DB Credentials Hardcoded** | `neon_client.py` has real connection string in source | Security risk; should use env var only |

**Files:**
- `api.py` — 233 lines, FastAPI with SSE
- `consumers.py` — 50 lines, MQTT subscribers
- `state_store.py` — 75 lines, thread-safe state
- `eta.py` — 116 lines, ETA calculation (ML + formula)
- `density.py` — 30 lines, MAC → occupancy
- `eta_predictor.py` — 133 lines, ML model loader
- `gtfs_loader.py` — 222 lines, GTFS parser (wrong path)
- `gtfs_ml_trainer.py` — 248 lines, training script (wrong path)
- `neon_client.py` — 483 lines, Neon HTTP SQL wrapper
- `model/eta_model.pkl` + `model_meta.json` — **real trained model exists**

---

### CH-4: Dashboard (`dashboard/`)

**What's Real:**
- Astro + React + TypeScript setup
- SSE connection via `useTransitStream` hook with auto-reconnect (5 attempts, 3s delay)
- **Fallback to mock data** when SSE fails (`DEFAULT_MOCK` constant)
- Neon route/stop search via `useNeonRoutes` hook
- InjectPanel UI component with buttons for delay/dropout/crowd/reset
- EventLog component displays pipeline events
- Chalo-style map with Leaflet (nearby mode + route tracking mode)
- Occupancy badges with color-coded levels
- Multi-agency selector, route search, stop lookup

**What's Mock/Placeholder:**

| Component | Reality |
|-----------|---------|
| **Map Buses (Nearby Mode)** | **Hardcoded fake buses** in `ChaloMap`: S26, 26G R, S86, 70CCT R with fixed coordinates & occupancy |
| **Map Stops (Nearby Mode)** | Falls back to `stopPositions` array (hardcoded offsets) when Neon coords missing |
| **Route Tracking Bus Marker** | Uses `data.vehicle.lat/lon` from SSE — **but SSE fails → shows mock position** |
| **InjectPanel API Calls** | Calls `/inject/*` endpoints that **don't exist** in CH-1 control_api |
| **Reset Button** | Calls `/reset` — **not implemented** |
| **Occupancy on Home Cards** | Reads from `data.inbound.occupancy_band` (from SSE) — but SSE is mock |
| **Event Log** | Reads from `data.event_log` (from SSE) — but SSE is mock |
| **Route Stops** | Tries Neon DB first, falls back to `ACCURATE_CHENNAI_ROUTES` hardcoded coords |

**Critical Flow Break:**
1. Dashboard loads → SSE connection to `localhost:8002/stream` fails (CH-3 not receiving data)
2. Falls back to `DEFAULT_MOCK` — static snapshot, no live updates
3. Judge clicks "Delay (+5m)" → POST to `localhost:8001/inject/delay?min=5` → **404**
4. No telemetry injected → CH-2 never sees dropout → Kalman never demonstrates smoothing
5. CH-3 never receives delay → T_dwell never shrinks → recovery demo invisible
6. Dashboard shows static mock data — **judges see no live pipeline**

**Files:**
- `src/lib/useTransitStream.ts` — SSE hook with mock fallback
- `src/components/ChaloHomeView.tsx` — 1400+ lines, main UI
- `src/components/InjectPanel.tsx` — 96 lines, **wrong API endpoints**
- `src/components/EventLog.tsx` — 63 lines, displays mock events
- `src/components/ChaloMap` (inside ChaloHomeView) — **hardcoded fake buses/stops**
- `src/lib/useNeonRoutes.ts` — Neon DB hooks

---

## Cross-Channel Contract Violations

| Contract | CH-1 Produces | CH-2 Expects | CH-3 Expects | CH-4 Expects |
|----------|---------------|--------------|--------------|--------------|
| **MQTT Topic (telemetry)** | `transitsense/vehicle/{id}/telemetry` | `fleet/bus_1/telemetry` | `fleet/bus_1/telemetry` (MAC) | N/A |
| **MQTT Topic (fused)** | N/A | `fleet/bus_1/fused` | `fleet/bus_1/fused` | N/A |
| **GNSS Valid Field** | ❌ Missing | ✅ `gnss_valid` bool | N/A | N/A |
| **MAC Delta Field** | ❌ Missing | N/A | ✅ `mac_count_delta` | N/A |
| **Delay Flag** | `hold_remaining_s`, `schedule_deviation_s` | N/A | ✅ `event_flags.delay_min` | N/A |
| **Leg State** | `leg_state` (EN_ROUTE/HOLD/DWELL) | `leg` (outbound/dwell/inbound) | `leg` | `leg` |
| **Progress** | `percent_leg_complete` (0-100) | `progress` (0-1) | `progress` | `progress` |
| **Control API** | `/vehicles/{id}/delay` etc. | N/A | N/A | `/inject/delay` etc. ❌ |

---

## What Needs Fixing (Priority Order)

### 🔴 Critical (Pipeline Won't Work At All)

1. **Align MQTT Topics** — CH-1 must publish to `fleet/bus_1/telemetry` (or CH-2/3 subscribe to CH-1's topic)
2. **Align Telemetry Payload** — CH-1 must emit fields CH-2/3 expect: `gnss_valid`, `mac_count_delta`, `event_flags`, `leg`, `progress`
3. **Fix Control API Endpoints** — CH-1 must implement `/inject/delay`, `/inject/dropout`, `/inject/crowd`, `/reset` (or Dashboard must call correct endpoints)
4. **Fix GTFS Data Path** — Point `gtfs_loader.py` to `shared/data/unified/` or `shared/data/cmrl-gtfs/`

### 🟡 High (Demo Features Broken)

5. **Remove Hardcoded Mock Buses** — `ChaloMap` nearby mode must use real SSE vehicle data
6. **Wire Delay → Dwell Recovery** — CH-1 delay injection → CH-3 `delay_accumulated_sec` → dynamic `T_dwell`
7. **Neon DB Credentials** — Move to `.env`, not hardcoded in `neon_client.py`

### 🟢 Medium (Polish)

8. **Remove DEFAULT_MOCK Fallback** — Or make it obvious it's mock (banner: "DEMO MODE - SSE DISCONNECTED")
9. **Align AGENTS.md Docs** — Simulator AGENTS.md describes different contract than code
10. **Add Health Checks** — Each service should expose `/health` verifying upstream connectivity

---

## Verification Commands

```bash
# 1. Check MQTT topic alignment
mosquitto_sub -t "fleet/bus_1/telemetry" -v    # Should see CH-1 messages
mosquitto_sub -t "fleet/bus_1/fused" -v        # Should see CH-2 messages

# 2. Test CH-1 Control API (if fixed)
curl -X POST "http://localhost:8001/inject/delay?min=5"
curl -X POST "http://localhost:8001/inject/dropout?sec=10"
curl -X POST "http://localhost:8001/inject/crowd?delta=20"
curl -X POST "http://localhost:8001/reset"

# 3. Test CH-3 SSE
curl -N http://localhost:8002/stream    # Should stream JSON every 1s

# 4. Test CH-3 REST
curl http://localhost:8002/eta
curl http://localhost:8002/routes

# 5. Run Kalman verification
cd kalman_service && python verify.py    # Should print [PASS]

# 6. Check GTFS loading
cd eta_engine && python -c "from gtfs_loader import load, get_network_stats; load(); print(get_network_stats())"
```

---

## File Inventory: Real vs Mock

| File | Status | Notes |
|------|--------|-------|
| `simulator/simulator.py` | ✅ Real | Core engine works |
| `simulator/control_api.py` | ⚠️ Wrong Endpoints | Implements different API than Dashboard calls |
| `kalman_service/kalman.py` | ✅ Real | Verified by `verify.py` |
| `kalman_service/subscriber.py` | ✅ Real | MQTT glue correct |
| `kalman_service/verify.py` | ✅ Real | **Passes** |
| `eta_engine/api.py` | ✅ Real | FastAPI + SSE correct |
| `eta_engine/consumers.py` | ✅ Real | MQTT subscribers correct |
| `eta_engine/state_store.py` | ✅ Real | Thread-safe state |
| `eta_engine/eta.py` | ✅ Real | ETA math correct |
| `eta_engine/density.py` | ✅ Real | MAC → band correct |
| `eta_engine/eta_predictor.py` | ✅ Real | ML loader with fallback |
| `eta_engine/gtfs_loader.py` | ⚠️ Wrong Path | Data dir doesn't exist |
| `eta_engine/gtfs_ml_trainer.py` | ⚠️ Wrong Path | Same path issue |
| `eta_engine/neon_client.py` | ✅ Real | But hardcoded credentials |
| `eta_engine/model/eta_model.pkl` | ✅ Real | Trained model exists |
| `dashboard/src/lib/useTransitStream.ts` | ⚠️ Mock Fallback | Hides connection failures |
| `dashboard/src/components/ChaloHomeView.tsx` | ⚠️ Hardcoded Map | Fake buses in nearby mode |
| `dashboard/src/components/InjectPanel.tsx` | ❌ Wrong API | Calls non-existent endpoints |
| `dashboard/src/components/EventLog.tsx` | ⚠️ Mock Data | Shows mock events when SSE down |

---

## Conclusion

**The pipeline is architecturally sound but integration-broken.** Each channel works in isolation (CH-2 Kalman is production-quality; CH-3 ML model is trained and loads; CH-1 simulator has a real physics engine). However, **contract mismatches at every boundary** prevent data flow.

**Minimum viable demo fix (2-3 hours):**
1. Change CH-1 MQTT topic to `fleet/bus_1/telemetry` and payload to match CH-2/3 expectations
2. Add `/inject/*` and `/reset` endpoints to CH-1 control_api.py
3. Fix GTFS data path in `gtfs_loader.py` to point at `shared/data/cmrl-gtfs/`
4. Remove hardcoded mock buses from `ChaloMap` nearby mode
5. Test end-to-end: inject delay → see T_dwell shrink on dashboard

After these fixes, the judge demo flow works: **button press → live pipeline reaction → visible UI change within 2 seconds.**