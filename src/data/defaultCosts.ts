import type { RoundCost } from "../domain/types";

export const defaultCosts: RoundCost[] = [
    { round: 1, fans: 50_000, gems: 50 },
    { round: 2, fans: 80_000, gems: 80 },
    { round: 3, fans: 100_000, gems: 100 },
    { round: 4, fans: 120_000, gems: 120 },
    { round: 5, fans: 150_000, gems: 150 },
    { round: 6, fans: 300_000, gems: 200 },
    { round: 7, fans: 450_000, gems: 280 },
    { round: 8, fans: 600_000, gems: 350 },
    { round: 9, fans: 750_000, gems: 400 },
    { round: 10, fans: 900_000, gems: 450 },
    { round: 11, fans: 1_100_000, gems: 500 },
    { round: 12, fans: 1_300_000, gems: 600 },
    { round: 13, fans: 1_700_000, gems: 800 },
    { round: 14, fans: 2_000_000, gems: 900 },
    { round: 15, fans: 2_200_000, gems: 1_000 },
];

export const defaultFanBalance = 11_800_000;
export const defaultGemBalance = 5_980;
export const defaultGemFanValue = 2_000;
export const maxPulls = defaultCosts.length;
