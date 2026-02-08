
export class GeneratorState {
    lastClockX = -2000;
    lastAcX = -2000;
    lastEboxX = -2000;
    lastCoolerX = -2000;

    reset() {
        this.lastClockX = -2000;
        this.lastAcX = -2000;
        this.lastEboxX = -2000;
        this.lastCoolerX = -2000;
    }

    // Helpers to check and register placements
    
    // CLOCK: Check distance from previous clock AND nearby wall objects (AC, E-Box)
    canPlaceClock(x: number) { 
        return (x - this.lastClockX > 800) && 
               (Math.abs(x - this.lastAcX) > 120) &&
               (Math.abs(x - this.lastEboxX) > 120);
    }
    registerClock(x: number) { this.lastClockX = x; }

    // AC: Check distance from previous AC AND nearby clocks AND nearby E-Boxes
    // Increased distance to prevent clutter
    canPlaceAc(x: number) { 
        return (x - this.lastAcX > 600) && 
               (Math.abs(x - this.lastClockX) > 150) &&
               (Math.abs(x - this.lastEboxX) > 400); // Mutual exclusion distance
    }
    registerAc(x: number) { this.lastAcX = x; }

    // E-BOX: Check distance from previous E-Box AND nearby clocks AND nearby ACs
    // Increased distance to prevent clutter
    canPlaceEbox(x: number) { 
        return (x - this.lastEboxX > 600) && 
               (Math.abs(x - this.lastClockX) > 150) &&
               (Math.abs(x - this.lastAcX) > 400); // Mutual exclusion distance
    }
    registerEbox(x: number) { this.lastEboxX = x; }

    // Cooler check
    canPlaceCooler(x: number) { return x - this.lastCoolerX > 800; }
    registerCooler(x: number) { this.lastCoolerX = x; }
}

export const generatorState = new GeneratorState();
