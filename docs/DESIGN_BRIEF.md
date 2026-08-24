# TransitSense UI Design Brief — PostHog Visual System Integration

## Overview & Aesthetic Direction
- **Inspiration**: PostHog Developer-Tools Visual System (`posthog/DESIGN.md`).
- **Core Theme**: High-density developer & transit telemetry intelligence on structured bordered cards with high contrast, crisp IBM Plex / Inter typography, and vibrant accent badges (`#f7a501` yellow CTA pill, `#0284c7` blue route line).
- **Surface Geometry**: 6px-8px rounded bordered cards (`#0f172a` / `#1e293b`), tactile 44px+ touch targets, and code-block data streams.
- **Color Palette**:
  - Primary Action Pill: `#f7a501` (PostHog Saturated Yellow-Orange)
  - Map & Polyline Accent: `#0284c7` (Electric Blue)
  - Occupancy Density Bands: 🟢 Emerald (`#22c55e`), 🟡 Amber (`#f59e0b`), 🟠 Orange (`#f97316`), 🔴 Rose (`#ef4444`)
  - Deep Surface Canvas: `#020617` (Deep Slate / Dark Mode)

## Shaped Component Guidelines
1. **Kiosk Header**: High-contrast brand identity with logo, route code pill badges, and quick agency selector button.
2. **Telemetry Map & Vector Canvas**: MapLibre GL / Leaflet CartoDB tiles with glowing polyline path and animated vehicle chevron.
3. **ETACountdown & Density Badges**: Bold `MM:SS` hero countdown display with dynamic color state transitions on delay/recovery.
4. **Interactive Inject Panel**: 48px high-touch target action buttons for delay (+5m), GNSS dropout (10s), crowd spike (+20 pax), and simulation reset.
5. **API Inspector Modal**: Embedded data contract viewer detailing ports `:8001`, `:8002`, and `:1883`.
