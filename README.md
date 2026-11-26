# 🚕 Addis Taxi Rush (አዲስ ታክሲ ራሽ) - 3D Edition

An authentic 3D Ethiopian highway arcade racer built with Three.js WebGL, vanilla TypeScript, and HTML5 Canvas. Drive iconic Addis Ababa vehicles through bustling city avenues, mountain passes, and sprawling highways with real-time 3D lighting, procedural models, and authentic street atmosphere!

---

## 🎮 Playable 3D Vehicles & Classes

* **ሰማያዊ ሚኒባስ ታክሲ (Toyota HiAce Blue Minibus Taxi)**: The balanced, high-capacity Addis Ababa workhorse with roof luggage rack, dual working headlights, and turning wheels.
* **የድሮ ላዳ ታክሲ (Classic Lada 1200 Taxi)**: Swift, high top-speed private cab with authentic blue & white livery and illuminated roof taxi sign.
* **ባጃጅ ድሪፍተር (Addis Bajaj Drifter)**: Ultra-agile 3-wheeler with single front steering wheel, open cabin sides, and 1.5× near-miss combo multiplier.
* **አይሱዙ የጭነት መኪና (Isuzu Heavy Freight Truck)**: Massive mountain beast with wooden stake bed cargo, dual rear axle wheels, capable of plowing through potholes and small traffic.

---

## ✨ 3D Features & Realism

* **Full Three.js WebGL 3D Engine**:
  * Continuous 3D double-sided asphalt highway with volcanic red clay shoulders and concrete curbs.
  * 3,000m × 3,000m continuous highland savanna ground terrain (no floating cars or empty voids).
  * Directional sun lighting with PCF soft shadows and ACES Filmic tone mapping.
  * Real-time 3D rain particle system with illuminated lightning flashes.
* **Dr. Driving Urban Intersections & 3D Traffic Light Grid**:
  * **Overhead Highway Traffic Light Gantries**: High-truss gantries situated across major Addis junctions (Kazanchis, Piazza, Bole, Olympia, Meskel Square, Abanefso, and Shiro Meda). Features dynamic 3-phase cycle: **Green (13s)**, **Amber (3s)**, and **Red (10s)** with emissive signal lenses and overhead illuminators.
  * **Asphalt Surface Markings**: Solid white stop bars, 3-lane directional asphalt arrows (left, through, right), and pedestrian zebra crossings.
  * **Red Light Law Enforcement**: Passing the stop line during a red light triggers a **-100 ETB traffic citation**, synthesized Ethiopian dual-tone police pea whistle (**"ፊሽካ"**), Weyala warning, and red screen flash.
  * **Lawful Driver Bonus**: Halting before the stop line during red and waiting until green rewards **+75 ETB bonus fare** and coin chime.
  * **Cross-Street Traffic Flow & T-Bone Physics**: Autonomous cross traffic (Ladas, Bajajs, Minibuses, Isuzu trucks) flows perpendicular during red cycles; running the junction box results in violent T-bone collisions, rollover chassis tilt, and damage penalties.
* **Dr. Driving Cockpit Active Rearview Mirror**:
  * Windshield-mounted beveled convex rearview mirror displaying trailing traffic vehicles behind the taxi with depth perspective and glowing headlights.
  * **Dynamic Reverse Parking Guidelines**: Shifting into Reverse (<kbd>R</kbd>) transforms the mirror into a digital backup monitor with multi-tiered green/yellow/red distance guides and steering-wheel-linked curved trajectory rails.
* **Racing Limits Multi-Mode Highway Racing & Traffic Flow**:
  * **Game Modes**:
    * **Career Mode (የስራ ጉዞ)**: Authentic taxi route contracts with passenger boarding targets, checkpoint gates, urban traffic light intersections, and fares.
    * **Infinite Highway (ማለቂያ የሌለው መንገድ)**: Endless Addis-Adama expressway slalom with zero passenger pressure; high-speed survival scoring with seamless track looping.
    * **Time Attack (የጊዜ ውድድር)**: High-stakes 60-second countdown sprint where precision near misses and oncoming daredevil passes extend the timer by **+2.5s**.
    * **Free Ride (ነፃ ጉዞ)**: Relaxed, unhurried scenic cruise across the Entoto highland pass with zero timer or fuel depletion.
  * **Traffic Flow Selectors**:
    * **One-Way Traffic Flow (አንድ አቅጣጫ)**: All traffic heads forward across 3 lanes.
    * **Two-Way Oncoming Traffic Flow (ሁለት አቅጣጫ)**: Oncoming traffic charges head-on down the left lane with 180° rotated 3D models and glaring headlights. Continuous high-speed driving in oncoming lane rewards **+20 ETB/s risk bonus**; close passes generate acoustic Doppler shifts and **+50 ETB Oncoming Daredevil bonus**.
* **Dynamic FOV Tunnel Vision & Aerodynamic Camera Shake**:
  * Dynamic camera FOV expands from 60° to 78° as vehicle speed climbs above 100 km/h, warping to 84° during Nitrous boost.
  * Aerodynamic camera vibration simulates turbulent airflow and wind buffeting above 130 km/h.
* **Nitrous Oxide (N2O) Boost System (<kbd>N</kbd> / <kbd>Shift</kbd>)**:
  * Dual cyan and electric-blue plasma exhaust flame jets ignite with high-boost turbo turbine spool whistle.
  * Releasing boost triggers triple-stage mechanical wastegate blow-off flutter.
  * Dynamic refill through near-miss overtakes (+18%), oncoming daredevil passes (+25%), oncoming lane driving (+14%/s), and Bunna coffee pickups (100%).
  * Cockpit HUD diagnostics pod displays live segmented cyan N2O boost gauge.
* **Reactive Traffic AI & Lane-Changing Blinkers**:
  * Autonomous AI vehicles assess open lanes, signal with flashing amber turn indicators (3.5 Hz) for 1.2s, and smoothly steer between lanes.
  * Honking the horn (<kbd>Space</kbd> / <kbd>H</kbd>) triggers urgent yielding reactions: traffic activates hazard blinkers and swerves to the shoulder, accompanied by Weyala praise callouts ("መንገድ ለቀቁ! ግባበት!").
* **Multi-Camera System (<kbd>C</kbd> or `🎥 CAM`)**:
  * **Chase Cam**: Dynamic trailing perspective aligned with the highway tangent, with high-speed zoom and steering lean.
  * **Hood Cam**: High-speed first-person bumper view over the front hood.
  * **Top-Down Cam**: High-altitude bird's-eye helicopter tracking view.
* **Procedural Ethiopian 3D Vehicles & Traffic**:
  * Authentic models for Minibuses, Ladas, Bajajs, Isuzu trucks, and Federal Police patrol cruisers.
  * Wheels spin dynamically matching vehicle velocity; front wheels angle with steering input.
  * Federal Police patrol car with alternating red & blue high-intensity LED strobe lights.
* **3D Hazards & Wandering Herds**:
  * Ethiopian Zebu cattle with iconic thoracic humps and long curved horns.
  * Highland goats with horns and alert ears that scatter when you sound the taxi horn (<kbd>H</kbd>).
  * Weathered circular asphalt pothole depressions with jagged broken aggregate rims.
* **3D Collectibles & Pickups**:
  * Spinning 3D Gold Birr coins (የብር ሳንቲም) floating along highway lanes.
  * Traditional black clay Bunna Jebena (የቡና ጀበና) with woven straw bases and golden coffee aroma bobbing over the road.
  * Red jerry cans of fuel (ቤንዚን ቦቲ) with caps and carrying handles.
* **Iconic Addis Landmarks & Scenery**:
  * The 209-meter **Commercial Bank of Ethiopia (CBE) Headquarters Tower** dominating the Addis skyline.
  * Elevated **Addis Ababa Light Rail Transit (AALRT)** viaduct with animated green & white 3-car electric train.
  * Umbrella Acacia trees, tall Eucalyptus (Bahir Zaf) groves, curved highway street lamps, and commercial billboards.
  * Pedestrians waiting at taxi stops wearing traditional white Netela shawls with green Tibeb embroidery, raising hands to hail the taxi.
* **Dual-Canvas Architecture**:
  * Seamless layering of WebGL 3D road/world rendering underneath high-resolution 2D cockpit HUD, binnacles, and CRT scanline filters.
* **Addis Taxi FM Radio & Weyala Street Audio**:
  * 4-station in-cab radio (<kbd>R</kbd>): Sheger FM 102.1, Bisrat FM 101.1, Fana FM 98.1, or Radio OFF.
  * Weyala conductor callouts ("መገናኛ! መገናኛ!", "ቀስ በል! ጉድጓድ አለ!", "ተሳፋሪ ወርዷል!") synthesized via Web Audio API.

---

## ⌨️ Controls & Dr. Driving Simulation

| Control | Keyboard | Touch / On-Screen Canvas |
| :--- | :--- | :--- |
| **Steering Wheel** | <kbd>◀</kbd> / <kbd>▶</kbd> or <kbd>A</kbd> / <kbd>D</kbd> | Arc-drag rotational on-screen steering wheel |
| **Gas Pedal** | <kbd>▲</kbd> or <kbd>W</kbd> | Press & hold on-screen analog Gas pedal |
| **Brake / Reverse** | Hold <kbd>S</kbd> to brake, then reverse. Hold <kbd>W</kbd> to return to drive. <kbd>▼</kbd> operates the brake pedal. | Press & hold on-screen analog Brake pedal |
| **PRND Shifter** | <kbd>Q</kbd> / <kbd>E</kbd> or <kbd>1</kbd>-<kbd>4</kbd> | Tap/drag on-screen PRND shifter lever slots |
| **Nitrous Oxide Boost** | <kbd>N</kbd> or <kbd>Shift</kbd> | Auto-boost during high-speed forward acceleration |
| **Toggle 3D Camera** | <kbd>C</kbd> | Click `🎥 CAM` button (*Chase ➔ Hood ➔ Top-Down*) |
| **60 FPS Performance Mode** | <kbd>O</kbd> | Click `⚡ PERF` button (Disable shadows & optimize 60 FPS) |
| **Taxi Horn** | <kbd>H</kbd> or <kbd>Space</kbd> | Tap center steering wheel boss (`📢 HORN`) |
| **Taxi FM Radio** | <kbd>R</kbd> | Click `📻 RADIO` (4 stations) |
| **Hazard Flashers** | <kbd>F</kbd> | Click `⚠️ HAZARDS` |
| **Garage & Upgrades** | <kbd>G</kbd> | Click `🚗 GARAGE` |
| **Pause Game** | <kbd>P</kbd> or <kbd>Escape</kbd> | Click `⏸️ PAUSE` |
| **Toggle Sound** | <kbd>M</kbd> | Click `🔊 AUDIO` |
| **Toggle Scanlines** | Click on-screen button | `📺 CRT` |
| **Fullscreen** | Click on-screen button | `⛶ FULL` |

---

## 🛣️ Routes

1. **መገናኛ ➔ ፒያሳ (Megenagna to Piazza)**: Morning rush hour, historic avenues, Light Rail viaduct, high passenger density.
2. **ቦሌ ➔ መስቀል አደባባይ (Bole to Meskel Square)**: Wide boulevards, fast traffic dodging, CBE 209m Tower skyline, sunset glow.
3. **መርካቶ ➔ እንጦጦ ተራራ (Merkato to Entoto Mountain)**: Steep mountain climb, wandering Zebu cows & sheep, rain storm and night headlight driving.

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
* `v2.1.0`: Mobile & Tablet Touch HUD Feature Parity
* `v2.2.0`: Addis Light Rail Transit (LRT) Viaduct Animation & Pedestrian Zebra Crossings
* `v3.0.0`: Three.js WebGL 3D Scene Initialization, Highland Ground Plane & Dual-Canvas Architecture
* `v3.1.0`: Continuous 3D Highway Ribbon Mesh with Volcanic Red Clay Shoulders & Markings
* `v3.2.0`: Procedural Ethiopian 3D Vehicle Models with Dynamic Wheel Rotation & Steer Pitch/Roll
* `v3.3.0`: 3D Traffic Vehicles, Zebu Cattle, Highland Goats, Potholes & Collectibles
* `v3.4.0`: Tangent-Aligned Multi-Camera Tracking (Chase, Hood, Top-Down) & Stage Lighting
* `v3.5.0`: Final 3D Polish, Landmark Viaduct Animations & Complete System Documentation
* `v3.6.0`: Dr. Driving PRND Transmission System with Reverse Driving Physics & Neutral Free-Revving
* `v3.7.0`: Rotatable On-Screen Steering Wheel with Arc-Drag Multi-Touch & Center Horn Cap
* `v3.8.0`: Analog Gas & Brake Pedals with Visual Travel Depth & 3D Taillight Flare
* `v3.9.0`: Complete Dr. Driving Cockpit Integration, Console Shifter & System Polish
* `v4.0.0`: Urban Intersections, 3D Traffic Light Gantries, Stop Lines, and Signal State Machine
* `v4.1.0`: Red Light Infraction Fine (-100 ETB), Lawful Driver Bonus (+75 ETB), and Police Pea Whistle ("ፊሽካ")
* `v4.2.0`: Autonomous Cross-Street Traffic, AABB Junction Box Collision Detection, and T-Bone Rollover Physics
* `v4.3.0`: Dr. Driving Windshield Rearview Mirror with Live Trailing Reflections & [R] Dynamic Parking Guidelines
* `v4.4.0`: Comprehensive Option 3 Urban Traffic Grid, Collision Physics & Cockpit Documentation Release
* `v5.0.0`: Racing Limits Multi-Mode Architecture & Traffic Flow Selector (Career, Infinite Highway, Time Attack, Free Ride)
* `v5.1.0`: Two-Way Oncoming Traffic Flow, Doppler Shift Audio, and Oncoming Lane Risk Multiplier (+20 ETB/s)
* `v5.2.0`: Dynamic FOV Tunnel Vision (60° to 84°), Aerodynamic Camera Vibration & Speed Warping (>130 km/h)
* `v5.3.0`: Nitrous Oxide Boost System with Dual Blue Flame Jets, Turbo Turbine Spool, and BOV Flutter
* `v5.4.0`: Reactive Traffic AI with Flashing Amber Turn Signals, Autonomous Lane Changes, and Horn Yielding
* `v5.5.0`: Comprehensive Racing Limits Engine Documentation, Controls Matrix, and Release Verification
* `v5.6.0`: 60 FPS Performance Overhaul, Elimination of Dual-Engine Bottlenecks, 80+ Light Pruning, and Camera Stabilization
* `v5.6.1`: Performance Architecture Documentation, Highway Grade Optimization, and Release Verification

---

## ⚡ 60 FPS Performance Architecture & Optimization

To ensure smooth 60+ FPS on standard laptops, PCs, and mobile devices:
1. **Elimination of Dual-Engine Rendering Overhead**: The legacy 2D OutRun software rasterizer (1,400+ polygon fills and curve loops per frame) has been completely retired from the HUD overlay, reserving `canvasHud` strictly for lightweight binnacles, steering wheel, and retro arcade gauges.
2. **Dynamic Light Pruning (GPU Fillrate Optimization)**: Traffic vehicles (40–65 cars) now utilize high-performance emissive materials (`headlightOn`) rather than hardware `THREE.SpotLight` instances. Only the player vehicle casts dynamic spotlights, eliminating 80–120 active dynamic lights that choked WebGL shaders.
3. **Highway Grade & Camera Stabilization**: Spine elevation scale calibrated to a realistic highway standard (`0.005`), upward counter-clockwise face winding order, terrain elevation sync (`terrainMesh.position.y = playerPos.y - 0.2`), and horizontal-tangent chase camera tracking eliminate clipping below the asphalt.
4. **Instant 60 FPS Performance Toggle**: Toggle between High Quality (soft shadows, 1.25x pixel ratio) and Performance Mode (shadows disabled, 1.0x pixel ratio) via the `⚡ PERF` header button or <kbd>O0</kbd> key.
