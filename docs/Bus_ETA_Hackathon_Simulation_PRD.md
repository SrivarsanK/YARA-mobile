# PRD: Hackathon Simulation Build — Two-Way Transit Tracking & Compounding ETA

## 0. Why this PRD is different from the original

The original doc specced a real deployment: physical GNSS/cellular hardware on buses, live BLE/Wi-Fi sniffing, MQTT brokers talking to a real fleet, a trained TFT model. None of that is buildable in a hackathon window.

This PRD replaces every hardware/real-world dependency with a **simulator that emits the exact same data shape** the real system would — same MQTT topics, same GTFS-RT-style payloads, same feature schema. Everything downstream (Kalman filter, ETA engine, density estimator, dashboard) is real code, just fed synthetic input instead of a real vehicle. That's the trick that makes it demo-able **and** technically credible to judges: you can show the actual architecture, not a mockup.

**Non-negotiable requirement: single connected pipeline.** One simulated event (e.g., "bus delayed 6 min") must visibly ripple through every layer — position, dwell-time prediction, inbound ETA, occupancy — in the same demo run. No isolated per-feature demos.

---

## 1. Goal & Judging Alignment

Demonstrate, live, that a single physical bus becomes visible to inbound-route passengers *before* it finishes its outbound trip, with an ETA that dynamically recalculates as conditions change, and a crowd-density number attached to it — all driven by one coherent simulated data feed.

**One-sentence demo pitch:** "Watch this bus disappear from Route A and instantly become a live, shrinking ETA on Route B — before it's even arrived."

---

## 2. Scope Cuts (what's real vs. faked)

| Component | Real system | Hackathon build |
|---|---|---|
| Vehicle position | GNSS hardware on bus | **Simulator** interpolates lat/lon along a real GTFS shape at a settable speed |
| GNSS dropout | Physical tunnel/urban canyon | **Simulator** flag to inject dropout on command (button/timer) |
| Cellular fallback position | Cell tower triangulation API | **Simulator** emits a deliberately noisy/offset coordinate during dropout |
| Sensor fusion | — | **Real Kalman filter code**, fed simulated GNSS + simulated noisy fallback |
| Telemetry transport | MQTT over real modem | **Real MQTT broker** (public test broker or local Mosquitto container), simulator publishes real MQTT messages |
| GTFS-RT feed | Real fleet, real `block_id` chaining | **Real GTFS-RT-shaped JSON/protobuf**, built from a small hand-authored 2-route static GTFS (Station A ↔ Station B) with a shared `block_id` |
| ETA prediction | Trained TFT on historical fleet data | **Rule-based/lightweight-ML engine** (see §5) that produces the same three outputs (`T_outbound`, `T_dwell`, `T_inbound`) and reacts to injected delay events. If time allows, a small model trained on synthetic data; if not, a well-tuned heuristic is fine — judges care that the number updates intelligently, not the model class |
| Crowd density | Real Wi-Fi/BLE sniffing | **Simulator** emits a synthetic MAC-count stream with configurable "boarding" and "alighting" events |
| Occupancy field | Real `occupancy_status` in GTFS-RT | Populated from the same synthetic density stream — this is the connective proof point |

---

## 3. Unified Data Flow (this is the whole PRD in one diagram)

```
[Simulator Engine]
   |  publishes MQTT messages every 1s, topic: fleet/bus_1/telemetry
   |  payload: { lat, lon, speed, gnss_valid, mac_count_delta, event_flags }
   v
[MQTT Broker] --------------------------------------------+
   |                                                        |
   v                                                        v
[Kalman Fusion Service]                          [Density Aggregator Service]
   - smooths GNSS vs fallback coords                - windowed MAC count -> occupancy bucket
   - outputs clean {lat, lon}                        - outputs occupancy_status enum
   |                                                        |
   +--------------------+-----------------------------------+
                         v
              [ETA / State Engine]
   - tracks block_id chain: outbound trip -> inbound trip
   - computes T_outbound (remaining), T_dwell (predicted halt),
     T_inbound (Station B -> commuter position)
   - recalculates on every fused position update AND on injected
     delay/event triggers from the simulator
   - stitches occupancy_status into the inbound TripUpdate
                         |
                         v
              [GTFS-RT-shaped JSON feed]
   - VehiclePositions, TripUpdates (outbound + proactive inbound), Alerts
                         |
                         v
              [Dashboard / Mobile Demo UI]
   - map with vehicle icon (desaturated while "completing prior route")
   - live countdown for inbound ETA
   - occupancy badge
   - "inject delay" / "inject tunnel dropout" / "inject crowd spike" buttons
     for the judges to trigger live, on demand
```

Everything below the Simulator Engine is real, running code. The Simulator is the only "fake" box, and its job is to make the other four boxes behave exactly as they would in production.

---

## 4. Component Specs

### 4.1 Simulator Engine
- Authors a minimal GTFS static set: 2 routes (A→B, B→A), shared `block_id`, ~6–8 stops each, one vehicle
- Moves the vehicle along the shape at configurable speed; publishes position over MQTT at 1Hz
- Exposes a small control panel (or REST endpoints) for judges/you to trigger live:
  - **Delay injection** — slows the vehicle or adds a fixed-minute delay to remaining leg
  - **GNSS dropout** — switches published coordinates to noisy fallback values for N seconds
  - **Crowd event** — bursts synthetic MAC-address deltas (boarding at a stop)
- This is the only component that needs to look "produced" for the demo — the buttons are the whole show.

### 4.2 Kalman Fusion Service
- Consumes the raw stream, applies prediction/update steps exactly as spec'd in the original doc
- During GNSS dropout, down-weights the noisy fallback coordinate rather than snapping to it — this is the visual proof that fusion is real, not just position pass-through

### 4.3 ETA / State Engine
- Holds the `block_id` state machine: knows the bus is "currently outbound" and pre-computes the chained inbound `TripUpdate`
- `T_outbound`: distance remaining / current smoothed speed, adjusted by any injected delay
- `T_dwell`: start with a static baseline (e.g., 5 min), subtract a fraction of any accumulated outbound delay to demonstrate the "recovery time" behavior from the original doc — this alone is enough to show "dynamic dwell prediction" without a trained model
- `T_inbound`: static distance/speed calc from Station B to the requesting commuter's stop
- Recomputes and re-publishes on every position tick and every injected event — this is what makes the demo feel "live"

### 4.4 Density Aggregator
- Rolling window over synthetic MAC deltas → maps to GTFS-RT `occupancy_status` buckets (EMPTY / MANY_SEATS / STANDING_ROOM / FULL)
- Written into the *inbound* TripUpdate too, so judges see: "this returning bus is already predicted to be crowded" — ties Channel 2 and Channel 3 output into one field

### 4.5 Dashboard
- Map (Mapbox/Leaflet is fine) showing the vehicle, desaturated while on the outbound leg, with a badge: "Completing prior route — arriving as your bus in ~9 min"
- Countdown that visibly ticks down/up as events are injected
- Occupancy badge next to the ETA
- Event log panel so judges can see cause → effect explicitly ("Delay +5min injected at 14:32:10 → inbound ETA updated 14:32:11")

---

## 5. What to skip entirely if time-constrained

- Real ML training — a heuristic dwell/delay model is fine; state clearly in the pitch that the architecture supports swapping in a trained TFT
- Real cell-tower triangulation APIs — a fixed synthetic offset is enough to prove the fusion logic works
- MAC hashing/privacy pipeline — mention it in the pitch, don't build it, it's not visually demoable
- Multi-vehicle fleet — one bus, one chained block, is sufficient to prove the concept

---

## 6. Demo Script (judges see this in ~90 seconds)

1. Show the map: bus is 3 stops from Station B on the outbound leg, but is *already visible* as an inbound-route option with a live ETA — this is the core "trip-bound visibility gap" fix
2. Press **Inject Delay** — watch `T_outbound` grow, and watch `T_dwell` shrink slightly (recovery behavior) — inbound ETA updates within a second
3. Press **Inject Dropout** — position briefly noisy, Kalman-smoothed path stays visually clean instead of teleporting
4. Press **Inject Crowd** — occupancy badge flips from "Many seats" to "Standing room," visible on both the current trip and the pre-published inbound trip
5. Close on the event log showing all four numbers moved from one injected trigger — proving the pipeline is one connected system, not four demos glued together

---

## 7. Suggested Stack (fast to build)

- Simulator + services: Node.js or Python, single repo, each service as a small process/container
- Broker: Mosquitto (Docker) or a free public test broker for the demo
- Dashboard: Next.js + Leaflet/Mapbox, WebSocket or short-poll to the ETA engine's output
- No database needed — in-memory state is fine for a single simulated vehicle

---

## 8. Success Criteria

- [ ] One vehicle, one `block_id`, both legs visible simultaneously on the map
- [ ] Injecting any one event visibly changes at least two downstream numbers (proves the "connected" requirement)
- [ ] Kalman-smoothed path never visually teleports during a dropout
- [ ] Occupancy shows up on the *pre-published* inbound TripUpdate, not just current position
- [ ] End-to-end latency from injected event to UI update is sub-2-seconds
