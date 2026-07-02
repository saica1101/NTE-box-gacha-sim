import type { RoundCost } from "../domain/types";
import { defaultBoxGacha } from "./boxGachas";

export const defaultCosts: RoundCost[] = defaultBoxGacha.costs.map((cost) => ({
    ...cost,
}));

export const defaultFanBalance = 11_800_000;
export const defaultGemBalance = 5_980;
export const defaultGemFanValue = 2_000;
export const maxPulls = defaultCosts.length;
