# YARA Mobile — Design Document

> Visual design system, screen wireframes, component hierarchy, and UX patterns
> for the React Native mobile app — replicating the web dashboard's premium aesthetic.

---

## 1. Design Philosophy

Yara's design language follows four brand principles from [`PRODUCT.md`](file:///c:/Users/Srivarsan/Desktop/SIH-inthack-2026/PRODUCT.md):

1. **Certainty Over Complexity** — Clear ETAs with freshness timestamps build trust
2. **Privacy by Design** — Edge inference only; no raw video data
3. **Glanceable Accessibility** — High-contrast, large typography, outdoor readable
4. **Offline Resilience** — Graceful fallback states, never blank screens

---

## 2. Color System

### 2.1 Core Palette

| Token | Hex | Usage |
|---|---|---|
| `brand-primary` | `#2563EB` | MTC Chennai accent (from `agencies.ts` accentColor) |
| `brand-dark` | `#0F172A` | Primary text, dark backgrounds |
| `brand-surface` | `#FFFFFF` | Card backgrounds, light mode |
| `brand-surface-alt` | `#F8FAFC` | Page backgrounds, subtle sections |
| `border-subtle` | `#E2E8F0` | Card borders, dividers |
| `text-primary` | `#0F172A` | Headings, primary content |
| `text-secondary` | `#64748B` | Labels, timestamps, meta |
| `text-muted` | `#94A3B8` | Placeholders, disabled |

### 2.2 Occupancy Band Colors

Derived from the 4-band system in [`density.py`](file:///c:/Users/Srivarsan/Desktop/SIH-inthack-2026/eta_engine/density.py) and [`OccupancyBadge.tsx`](file:///c:/Users/Srivarsan/Desktop/SIH-inthack-2026/dashboard/src/components/OccupancyBadge.tsx):

| Band | Color | Hex | Icon |
|---|---|---|---|
| SEATS_AVAILABLE | Green | `#22C55E` | 🟢 |
| MODERATE | Yellow | `#EAB308` | 🟡 |
| STANDING_ROOM | Orange | `#F97316` | 🟠 |
| VERY_CROWDED | Red | `#EF4444` | 🔴 |

### 2.3 Status Indicator Colors

| State | Color | Usage |
|---|---|---|
| Connected (SSE live) | `#22C55E` | Pulsing green dot in header |
| Disconnected | `#EF4444` | Red dot + "Reconnecting..." text |
| Outbound leg | `#94A3B8` (desaturated) | Bus marker opacity 60% |
| Inbound leg | `#2563EB` (highlighted) | Bus marker full opacity |
| Dwell state | `#EAB308` | Amber pulse indicator |

### 2.4 Pipeline Status Colors (Overview Screen)

From [`ProjectLandingHome.tsx`](file:///c:/Users/Srivarsan/Desktop/SIH-inthack-2026/dashboard/src/components/ProjectLandingHome.tsx):

| Service | Active | Inactive |
|---|---|---|
| Simulator (CH-1) | `#22C55E` green | `#EF4444` red |
| Kalman Filter (CH-2) | `#22C55E` green | `#EF4444` red |
| ETA Engine (CH-3) | `#22C55E` green | `#EF4444` red |

---

## 3. Typography

| Token | Font | Size | Weight | Usage |
|---|---|---|---|---|
| `heading-xl` | System (SF Pro / Roboto) | 28px | Bold (700) | Screen titles |
| `heading-lg` | System | 22px | Semibold (600) | Section headers |
| `heading-md` | System | 18px | Semibold (600) | Card titles |
| `body-lg` | System | 16px | Regular (400) | Primary content |
| `body-md` | System | 14px | Regular (400) | Secondary content |
| `body-sm` | System | 12px | Regular (400) | Labels, timestamps |
| `mono-lg` | Menlo / monospace | 32px | Bold (700) | ETA countdown timer |
| `mono-md` | Menlo / monospace | 20px | Bold (700) | ETA component values |
| `mono-sm` | Menlo / monospace | 14px | Regular (400) | Event log timestamps |

---

## 4. Component Design System

### 4.1 Atomic Components

#### ETA Countdown
- Large monospace timer: `12:45` (MM:SS) 
- Ticks every second from SSE `T_total_sec`
- Color: `brand-primary` when healthy, `#EF4444` when stale (>10s without update)
- Subtitle: "ETA to arrival" in `text-secondary`

#### Occupancy Badge
- Rounded pill: colored background + white text
- Format: `"Seats Available"` / `"Moderate"` / `"Standing Room"` / `"Very Crowded"`
- Left icon: colored circle dot
- Matching the web's `OccupancyBadge.tsx` design

#### Live Signal Indicator
- 3 concentric arcs (WiFi-style) with pulsing animation
- Green when `isConnected`, red when disconnected
- Matches `LiveSignalIcon.tsx`

#### ETA Component Bar
- Horizontal stacked bar showing T_out (blue), T_dwell (amber), T_in (green)
- Each segment width proportional to its seconds value
- Labels below: "Outbound 7 min | Dwell 4 min | Inbound 25 min"

#### Trip Timeline
- Vertical step timeline: Outbound → Dwell → Inbound
- Current leg highlighted with pulsing dot
- Progress line fills based on `vehicle.progress`
- Matches `TripTimeline.tsx`

### 4.2 Card Components

#### Route Card (used in Route List + Search Results)
```
┌─────────────────────────────────────┐
│ 🚌  S26                    MTC ▸   │
│ Ashok Pillar → Valasaravakkam      │
│ 19 stops · 26 min · ₹15            │
└─────────────────────────────────────┘
```

#### Stop Card (used in Nearby Stops + Route Detail)
```
┌─────────────────────────────────────┐
│ 📍 Ashok Pillar          0.3 km 🚶  │
│    4 min walk                       │
│ ┌───────────────────────────────┐   │
│ │ S26 → Valasaravakkam   6 min │   │
│ │ 21G → Broadway         12 min│   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Event Log Entry (used in Admin Panel)
```
┌─────────────────────────────────────┐
│ 23:15:42  ETA recalculated          │
│ 720s → 1020s   (+300s ⚠️)          │
└─────────────────────────────────────┘
```

---

## 5. Screen Designs

### 5.1 Overview Screen (Tab 1)

```
┌─────────────────────────────────────┐
│ [Yara Logo]                    ⚙️   │
│                                     │
│    ╔═══════════════════════════╗    │
│    ║  Yara Transit Intelligence ║    │
│    ║  SIH 2026                  ║    │
│    ╚═══════════════════════════╝    │
│                                     │
│  Pipeline Status                    │
│  ┌────┐ ┌────┐ ┌────┐             │
│  │ 🟢 │ │ 🟢 │ │ 🟢 │             │
│  │SIM │ │KAL │ │ETA │             │
│  └────┘ └────┘ └────┘             │
│                                     │
│  Features                           │
│  ┌──────────┐ ┌──────────┐        │
│  │ Live ETA │ │ Density  │        │
│  │ ML-power │ │ 4-band   │        │
│  └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐        │
│  │ Kalman   │ │ Kiosk    │        │
│  │ Fusion   │ │ Display  │        │
│  └──────────┘ └──────────┘        │
│                                     │
│  [ 🚀 Launch Live Dashboard ]      │
│                                     │
├─────────────────────────────────────┤
│ 🏠  🗺️  🚌  ⭐  🔍               │
│ Home Map Track Routes Search        │
└─────────────────────────────────────┘
```

### 5.2 Live Map Screen (Tab 2)

```
┌─────────────────────────────────────┐
│ Yara ● Live    [Chennai MTC ▾]  🔔  │
├─────────────────────────────────────┤
│                                     │
│           ┌─────────┐              │
│           │   MAP   │              │
│           │         │              │
│        🚌◄──────────              │
│           │  route  │              │
│           │  line   │              │
│           │         │              │
│           └─────────┘              │
│                                     │
├─────────────────────────────────────┤
│  ┌─── Bottom Sheet (draggable) ──┐  │
│  │  BUS-001 · Outbound           │  │
│  │                                │  │
│  │  ┌────────────────────────┐   │  │
│  │  │     12:45              │   │  │
│  │  │  ETA to arrival        │   │  │
│  │  └────────────────────────┘   │  │
│  │                                │  │
│  │  T_out 7m │ T_dwell 4m │ T_in │  │
│  │  ██████████░░░░░░████████████ │  │
│  │                                │  │
│  │  🟢 Seats Available            │  │
│  │                                │  │
│  │  Nearby Stops:                 │  │
│  │  📍 Ashok Pillar (0.3 km)     │  │
│  │  📍 KK Nagar Depot (0.5 km)   │  │
│  └────────────────────────────────┘  │
├─────────────────────────────────────┤
│ 🏠  🗺️  🚌  ⭐  🔍               │
└─────────────────────────────────────┘
```

### 5.3 Route Detail Screen (Stack)

```
┌─────────────────────────────────────┐
│ ◀ Route S26                         │
├─────────────────────────────────────┤
│  Ashok Pillar → Valasaravakkam     │
│  19 stops · 26 min · ₹15           │
│                                     │
│  [Outbound ▾]  [Return]            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         MAP                  │   │
│  │   📍──📍──📍──📍──📍──📍   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Stop List:                         │
│  ① Ashok Pillar          05:30 AM  │
│  ② Jaffarkhanpet         05:33 AM  │
│  ③ KK Nagar Tel Exchange  05:36 AM  │
│  ④ Bharathidasan Colony   05:38 AM  │
│  ⑤ Kailankadai           05:40 AM  │
│  ⑥ Indra Colony          05:42 AM  │
│  ...                                │
└─────────────────────────────────────┘
```

### 5.4 Kiosk Screen (Fullscreen)

```
┌─────────────────────────────────────┐
│  YARA                  Bus Stop 42  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│        NEXT BUS                     │
│                                     │
│        12:45                        │
│      ┌──────────────┐              │
│      │ 🟢 SEATS     │              │
│      │ AVAILABLE     │              │
│      └──────────────┘              │
│                                     │
│  ┌────────────────────────────┐    │
│  │  Outbound  │ Dwell │ Inbound│    │
│  │  ████████░░│░░░░░░░│████████│    │
│  │  7 min     │ 4 min │ 25 min │    │
│  └────────────────────────────┘    │
│                                     │
│  Events:                            │
│  23:15 ETA recalculated +300s      │
│  23:14 GNSS dropout detected       │
│                                     │
│         Powered by Yara ·SIH 2026  │
└─────────────────────────────────────┘
```

### 5.5 Admin Panel (Modal/Screen)

```
┌─────────────────────────────────────┐
│ ◀ Judge Control Panel        🔴 REC │
├─────────────────────────────────────┤
│  Vehicle: [BUS-001 ▾]              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ⚠️  Inject Delay (+5 min) │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  📡  GNSS Dropout (10s)    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  👥  Crowd Spike (30s)     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Event Log:                         │
│  ┌─────────────────────────────┐   │
│  │ 23:15:42 ETA recalculated   │   │
│  │ 720s → 1020s  (+300s)       │   │
│  │ ─────────────────────────── │   │
│  │ 23:15:40 Delay +300s        │   │
│  │ injected on BUS-001         │   │
│  └─────────────────────────────┘   │
│                                     │
│  Pipeline Health:                   │
│  SIM 🟢  KAL 🟢  ETA 🟢  SSE 🟢  │
└─────────────────────────────────────┘
```

---

## 6. Animation & Motion

### 6.1 Micro-animations (react-native-reanimated)

| Element | Animation | Duration |
|---|---|---|
| Bus marker on map | Smooth interpolation between SSE positions | 1000ms (matches tick) |
| ETA countdown | Number ticker with spring easing | 300ms |
| Occupancy badge change | Color fade + scale pulse | 400ms |
| Bottom sheet | Spring-based drag gesture | physics-based |
| Connection indicator | Pulse (scale 1.0 → 1.3 → 1.0) | 2000ms loop |
| Route card press | Scale down 0.98 + opacity 0.9 | 100ms |
| Screen transitions | Shared element (map → detail) | 350ms |

### 6.2 Map Animations

- Bus marker: `Animated.timing` to smoothly interpolate lat/lon between 1Hz updates
- Route polyline: Draw-in animation on route detail open
- Stop markers: Staggered fade-in on nearby stops load

---

## 7. Responsive Layout

| Breakpoint | Device | Layout |
|---|---|---|
| < 375px | Small phones | Single column, compact cards |
| 375–430px | Standard phones | Default layout |
| > 430px | Large phones / small tablets | Wider cards, 2-col grid |
| > 768px | Tablets | Side-by-side map + list (like web desktop layout) |

### Kiosk Mode (Tablet)
- Force landscape orientation
- No tab bar — fullscreen arrival board
- Font scale 1.5× for outdoor readability
- Auto-lock prevention (`expo-keep-awake`)

---

## 8. Dark Mode

Full dark mode support with automatic system preference detection:

| Token (Light) | Token (Dark) |
|---|---|
| `#FFFFFF` surface | `#0F172A` surface |
| `#F8FAFC` bg | `#1E293B` bg |
| `#0F172A` text | `#F8FAFC` text |
| `#E2E8F0` border | `#334155` border |
| `#2563EB` accent | `#3B82F6` accent (slightly lighter) |

Map: Use dark map tiles (CartoDB Dark Matter or MapLibre dark style).
