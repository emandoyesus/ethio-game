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
| **Brake Pedal** | <kbd>▼</kbd> or <kbd>S</kbd> | Press & hold on-screen analog Brake pedal |
| **PRND Shifter** | <kbd>Q</kbd> / <kbd>E</kbd> or <kbd>1</kbd>-<kbd>4</kbd> | Tap/drag on-screen PRND shifter lever slots |
| **Toggle 3D Camera** | <kbd>C</kbd> | Click `🎥 CAM` button (*Chase ➔ Hood ➔ Top-Down*) |
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
