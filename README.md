# 🚕 Addis Taxi Rush (አዲስ ታክሲ ራሽ)

An authentic retro pseudo-3D Ethiopian highway arcade racer built with vanilla TypeScript and HTML5 Canvas. Drive iconic Addis Ababa vehicles through bustling city avenues, mountain passes, and sprawling highways!

---

## 🎮 Playable Vehicles & Classes

* **ሰማያዊ ሚኒባስ ታክሲ (Blue Minibus Taxi)**: The balanced, high-capacity Addis Ababa workhorse.
* **የድሮ ላዳ ታክሲ (Classic Lada Taxi)**: Swift, high top-speed private contract cab with premium passenger fares.
* **ባጃጅ ድሪፍተር (Addis Bajaj Drifter)**: Ultra-agile 3-wheeler with 1.5× near-miss combo multiplier.
* **አይሱዙ የጭነት መኪና (Isuzu Heavy Freight)**: Massive mountain beast capable of plowing through potholes and small traffic.

---

## ✨ Features

* **Lou's Pseudo-3D Engine**: Curvature accumulation, rolling hills, elevation changes, and distance fog.
* **Realism Physics**:
  * 5-speed automatic transmission with realistic RPM rev curves.
  * Chassis pitch (dive on braking, squat on acceleration) and body roll.
  * Dynamic suspension dampening with vertical jolts over potholes.
  * Persistent fading rubber skidmarks and brake light road reflections.
* **Dynamic Weather & Keremt Storms**:
  * Real-time rain simulation with lightning illumination and procedural thunder claps.
  * Wet road surface physics: tire spray mist, increased stopping distances, and specular road sheen.
* **Addis Taxi FM Radio & Weyala Street Audio**:
  * 4-station in-cab radio (<kbd>R</kbd>): Sheger FM 102.1 (Kirar groove), Bisrat FM 101.1 (Tizita soul), Fana FM 98.1 (Chic-chic tempo), or Radio OFF.
  * Weyala conductor voice callouts ("መገናኛ! መገናኛ!", "ቀስ በል! ጉድጓድ አለ!", "ተሳፋሪ ወርዷል!") combined with mechanical sliding door thumps.
* **Federal Police Checkpoints & Speed Traps**:
  * Roadside police checkpoints guarded by Federal Police patrol cruisers with alternating blue/red LED lightbars and warning cones.
  * Speed radar signs enforce 50 km/h zones: speeding (> 58 km/h) triggers siren alerts and 50 ETB fines; driving lawfully yields +30 ETB safe-driving bonuses.
* **Vehicle Mechanical Simulation**:
  * Dynamic radiator water temperature (°C) that heats up during high-speed redlining and Bunna turbo boosts.
  * Suspension alignment bias and wheel pull after rough pothole impacts.
  * 4-way emergency hazard flashers (<kbd>F</kbd>) with synchronized instrument blinkers.
* **Career Contracts & Delivery Missions**:
  * Special commercial missions with unique conditions (*Fresh Injera Morning Run*, *Diplomat Airport Express*, *Merkato Wholesale Freight*).
  * Direct ETB cash payouts into your driver wallet upon route completion.
* **Automotive Cockpit HUD**:
  * Glowing dual-cluster instrument binnacles (left: Diagnostics & Nitro; right: Speedometer, Gear, RPM).
  * Turn signal indicators and hazard blinkers with mechanical flasher audio.
  * Non-overlapping notification toast alerts below route progress bar.
* **Reactive Traffic AI**: Honking the horn (<kbd>H</kbd> / <kbd>Space</kbd>) clears wandering cattle, goats, and alerts traffic.
* **Garage & Tuning**: Persistent wallet balance, vehicle unlock system, and performance upgrades (Engine, Steering, Fuel, Turbo).
* **Web Audio Synthesis**: Synthesized multi-harmonic combustion engine, tire screech, Eskista Kirar melodies, Kebero drum beats, animal bleats, and dual-tone taxi horns with zero external audio assets required.

---

## ⌨️ Controls

| Control | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Accelerate** | <kbd>▲</kbd> or <kbd>W</kbd> | `⚡ GAS` |
| **Brake / Reverse** | <kbd>▼</kbd> or <kbd>S</kbd> | `🛑 BRAKE` |
| **Steer Left / Right** | <kbd>◀</kbd> / <kbd>▶</kbd> or <kbd>A</kbd> / <kbd>D</kbd> | `◀` / `▶` |
| **Taxi Horn** | <kbd>H</kbd> or <kbd>Space</kbd> | `📢 HORN` |
| **Taxi FM Radio** | <kbd>R</kbd> | `📻 RADIO` |
| **Hazard Flashers** | <kbd>F</kbd> | `⚠️ HAZARDS` |
| **Garage & Upgrades** | <kbd>G</kbd> | `🚗 GARAGE` |
| **Pause Game** | <kbd>P</kbd> or <kbd>Escape</kbd> | `⏸️ PAUSE` |
| **Toggle Sound** | <kbd>M</kbd> | `🔊 AUDIO` |
| **Toggle Scanlines** | Click on-screen button | `📺 CRT` |
| **Fullscreen** | Click on-screen button | `⛶ FULL` |

---

## 🛣️ Routes

1. **መገናኛ ➔ ፒያሳ (Megenagna to Piazza)**: Morning rush hour, historic avenues, high passenger density.
2. **ቦሌ ➔ መስቀል አደባባይ (Bole to Meskel Square)**: Wide boulevards, fast traffic dodging, CBE Tower skyline.
3. **መርካቶ ➔ እንጦጦ ተራራ (Merkato to Entoto Mountain)**: Steep winding climb, wandering Zebu cows & sheep, night headlight driving.

---

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Compile TypeScript and build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 🏷️ Milestones & Git Tags

* `v1.0.0`: Core Pseudo-3D Driving Game Engine
* `v1.1.0`: Impeccable Polish, Audio & Near-Miss Combos
* `v1.2.0`: Vehicle Garage & Upgrades Workshop
* `v1.3.0`: Realistic Cockpit HUD & Physics Overhaul
* `v1.4.0`: Cockpit UI Overhaul, Clean Binnacles & Non-Overlapping Toast System
* `v1.5.0`: Scenery & Environmental Realism (CBE Tower, Light Rail, Highland Horizons)
* `v1.6.0`: Dynamic Weather & Wet Road Physics (Keremt Storms, Water Spray, Lightning)
* `v1.7.0`: Addis Taxi FM Multi-Station Radio & Weyala Street Conductor Audio
* `v1.8.0`: Federal Police Roadside Checkpoints & Speed Trap Radar System
* `v1.9.0`: Thermal Radiator Overheating, Wheel Alignment Drift & Hazard Flashers
* `v2.0.0`: Career Contracts & Commercial Delivery Missions
