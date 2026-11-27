import { sound } from './audio';
import type { CareerContract, GameSaveData, Player, VehicleDef, VehicleId } from './types';

export const INITIAL_CONTRACTS: CareerContract[] = [
  {
    id: 'CONTRACT_INJERA',
    title: 'Fresh Injera Morning Run',
    titleAmharic: 'ትኩስ እንጀራ ማከፋፈል',
    client: 'Megenagna Bakery Union',
    clientAmharic: 'የመገናኛ እንጀራ ማዕከል',
    description: 'Rush freshly baked Injera from Megenagna to Piazza heritage hotels.',
    targetStageId: 1,
    rewardETB: 280,
    bonusCondition: 'Deliver at least 8 passengers on schedule',
    completed: false
  },
  {
    id: 'CONTRACT_DIPLOMAT',
    title: 'Diplomat Airport Express',
    titleAmharic: 'የአምባሳደር ፈጣን ጉዞ',
    client: 'Ministry of Foreign Affairs',
    clientAmharic: 'የውጭ ጉዳይ ሚኒስቴር',
    description: 'High-speed VIP escort along Bole Boulevard directly to the airport terminal.',
    targetStageId: 2,
    rewardETB: 380,
    bonusCondition: 'Deliver at least 12 passengers on schedule',
    completed: false
  },
  {
    id: 'CONTRACT_MERKATO',
    title: 'Merkato Wholesale Freight',
    titleAmharic: 'የመርካቶ ንግድ ጭነት',
    client: 'Merkato Traders Guild',
    clientAmharic: 'መርካቶ ጅምላ ንግድ ማኅበር',
    description: 'Climb steep Entoto mountain curves through nighttime Keremt downpour.',
    targetStageId: 3,
    rewardETB: 480,
    bonusCondition: 'Reach Entoto summit with at least 15s remaining',
    completed: false
  }
];

export const VEHICLE_CATALOG: Record<VehicleId, Omit<VehicleDef, 'unlocked' | 'upgrades'>> = {
  MINIBUS: {
    id: 'MINIBUS',
    name: 'Blue Minibus Taxi',
    nameAmharic: 'ሰማያዊ ሚኒባስ ታክሲ',
    tagline: 'The iconic Addis Ababa workhorse. High passenger capacity.',
    unlockPrice: 0,
    baseMaxSpeed: 5400,
    baseAccel: 2400,
    baseTurnSpeed: 2.9,
    baseMaxFuel: 100,
    basePassengerCap: 14,
    farePerPassenger: 50,
    hitboxWidth: 0.44
  },
  LADA: {
    id: 'LADA',
    name: 'Classic Lada Taxi',
    nameAmharic: 'የድሮ ላዳ ታክሲ',
    tagline: 'Fast and nimble private contract cab. High fare rates per passenger.',
    unlockPrice: 400,
    baseMaxSpeed: 6200,
    baseAccel: 2800,
    baseTurnSpeed: 3.3,
    baseMaxFuel: 85,
    basePassengerCap: 5,
    farePerPassenger: 110,
    hitboxWidth: 0.38
  },
  BAJAJ: {
    id: 'BAJAJ',
    name: 'Addis Bajaj Drifter',
    nameAmharic: 'ባጃጅ ድሪፍተር',
    tagline: 'Extreme cornering agility and slim body. 1.5x near-miss combo multiplier!',
    unlockPrice: 750,
    baseMaxSpeed: 4800,
    baseAccel: 3000,
    baseTurnSpeed: 3.8,
    baseMaxFuel: 75,
    basePassengerCap: 4,
    farePerPassenger: 85,
    hitboxWidth: 0.32
  },
  ISUZU: {
    id: 'ISUZU',
    name: 'Isuzu Heavy Freight',
    nameAmharic: 'አይሱዙ የጭነት መኪና',
    tagline: 'Unstoppable mountain beast. Plows through potholes with colossal fuel reserve.',
    unlockPrice: 1400,
    baseMaxSpeed: 5000,
    baseAccel: 2000,
    baseTurnSpeed: 2.4,
    baseMaxFuel: 150,
    basePassengerCap: 6,
    farePerPassenger: 130,
    hitboxWidth: 0.52,
    isPlow: true
  }
};

export const UPGRADE_PRICES = [180, 360, 600];

export class GarageManager {
  public walletBalance: number = 0;
  public highScore: number = 0;
  public selectedVehicleId: VehicleId = 'MINIBUS';
  public vehicles: Record<VehicleId, VehicleDef>;
  public contracts: CareerContract[] = [...INITIAL_CONTRACTS];

  constructor() {
    this.vehicles = this.initVehicles();
    this.load();
  }

  public checkContractCompletion(stageId: number, passengers: number, timeLeft: number): CareerContract[] {
    const newlyCompleted: CareerContract[] = [];
    for (const c of this.contracts) {
      if (c.completed) continue;
      if (c.targetStageId === stageId) {
        let success = false;
        if (c.id === 'CONTRACT_INJERA' && passengers >= 8) success = true;
        else if (c.id === 'CONTRACT_DIPLOMAT' && passengers >= 12) success = true;
        else if (c.id === 'CONTRACT_MERKATO' && timeLeft >= 15) success = true;

        if (success) {
          c.completed = true;
          this.walletBalance += c.rewardETB;
          newlyCompleted.push(c);
        }
      }
    }
    if (newlyCompleted.length > 0) {
      this.save();
    }
    return newlyCompleted;
  }

  private initVehicles(): Record<VehicleId, VehicleDef> {
    const list = {} as Record<VehicleId, VehicleDef>;
    for (const [id, def] of Object.entries(VEHICLE_CATALOG)) {
      const vId = id as VehicleId;
      list[vId] = {
        ...def,
        unlocked: vId === 'MINIBUS',
        upgrades: { engine: 0, steering: 0, fuel: 0, turbo: 0 }
      };
    }
    return list;
  }

  public get selectedVehicle(): VehicleDef {
    return this.vehicles[this.selectedVehicleId];
  }

  public selectVehicle(id: VehicleId): boolean {
    if (this.vehicles[id] && this.vehicles[id].unlocked) {
      this.selectedVehicleId = id;
      this.save();
      sound.playCoin();
      return true;
    }
    return false;
  }

  public unlockVehicle(id: VehicleId): boolean {
    const v = this.vehicles[id];
    if (!v || v.unlocked) return false;

    if (this.walletBalance >= v.unlockPrice) {
      this.walletBalance -= v.unlockPrice;
      v.unlocked = true;
      this.selectedVehicleId = id;
      this.save();
      sound.playBunnaBoost();
      return true;
    } else {
      sound.playPothole();
      return false;
    }
  }

  public upgradeVehicle(id: VehicleId, type: 'engine' | 'steering' | 'fuel' | 'turbo'): boolean {
    const v = this.vehicles[id];
    if (!v || !v.unlocked) return false;

    const currentLevel = v.upgrades[type];
    if (currentLevel >= 3) return false;

    const price = UPGRADE_PRICES[currentLevel];
    if (this.walletBalance >= price) {
      this.walletBalance -= price;
      v.upgrades[type]++;
      this.save();
      sound.playCoin();
      return true;
    } else {
      sound.playPothole();
      return false;
    }
  }

  public addEarnings(amount: number) {
    this.walletBalance += amount;
    if (amount > this.highScore) {
      this.highScore = amount;
    }
    this.save();
  }

  public applyToPlayer(player: Player) {
    const v = this.selectedVehicle;
    player.vehicleId = v.id;

    // Upgrades scaling
    const engineMult = 1 + v.upgrades.engine * 0.12;
    const steerMult = 1 + v.upgrades.steering * 0.14;
    const fuelMult = 1 + v.upgrades.fuel * 0.2;
    const turboDuration = 5.0 + v.upgrades.turbo * 1.5;

    player.maxSpeed = Math.round(v.baseMaxSpeed * engineMult);
    player.accel = Math.round(v.baseAccel * engineMult);
    player.turnSpeed = v.baseTurnSpeed * steerMult;
    player.maxFuel = Math.round(v.baseMaxFuel * fuelMult);
    player.fuel = player.maxFuel;
    player.boostMax = turboDuration;
    player.boostRemaining = 0;
  }

  public load() {
    try {
      const dataStr = localStorage.getItem('addis_taxi_save_v2');
      if (dataStr) {
        const data: GameSaveData = JSON.parse(dataStr);
        this.highScore = data.highScore || 0;
        this.walletBalance = data.walletBalance || 0;
        if (data.selectedVehicle && this.vehicles[data.selectedVehicle]) {
          this.selectedVehicleId = data.selectedVehicle;
        }

        if (data.vehicles) {
          for (const [id, saved] of Object.entries(data.vehicles)) {
            const vId = id as VehicleId;
            if (this.vehicles[vId] && saved) {
              this.vehicles[vId].unlocked = saved.unlocked;
              this.vehicles[vId].upgrades = {
                engine: saved.upgrades?.engine || 0,
                steering: saved.upgrades?.steering || 0,
                fuel: saved.upgrades?.fuel || 0,
                turbo: saved.upgrades?.turbo || 0
              };
            }
          }
        }
        if (data.completedContracts) {
          for (const c of this.contracts) {
            c.completed = data.completedContracts.includes(c.id);
          }
        }
      } else {
        // Migration from old highscore
        const oldScore = localStorage.getItem('addis_taxi_highscore');
        if (oldScore) {
          this.highScore = parseInt(oldScore, 10) || 0;
          this.walletBalance = this.highScore;
        }
      }
    } catch {
      // Fallback
    }
  }

  public save() {
    try {
      const vSave: GameSaveData['vehicles'] = {};
      for (const [id, v] of Object.entries(this.vehicles)) {
        const vId = id as VehicleId;
        vSave[vId] = {
          unlocked: v.unlocked,
          upgrades: { ...v.upgrades }
        };
      }

      const data: GameSaveData = {
        highScore: this.highScore,
        walletBalance: this.walletBalance,
        selectedVehicle: this.selectedVehicleId,
        vehicles: vSave,
        completedContracts: this.contracts.filter(c => c.completed).map(c => c.id)
      };

      localStorage.setItem('addis_taxi_save_v2', JSON.stringify(data));
      localStorage.setItem('addis_taxi_highscore', this.highScore.toString());
    } catch {
      // Ignore
    }
  }
}

export const garage = new GarageManager();
