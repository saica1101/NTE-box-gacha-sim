import {
    defaultFanBalance,
    defaultGemBalance,
    defaultGemFanValue,
    defaultCosts,
} from "../data/defaultCosts";
import type { OptimizationMode, RoundCost } from "../domain/types";
import { isOptimizationMode, validateCosts } from "../domain/validation";

export const storageKey = "nte-draco-box-sim";

export interface PersistedState {
    version: 1;
    fanBalance: number;
    gemBalance: number;
    targetPulls: number;
    mode: OptimizationMode;
    gemFanValue: number;
    costs: RoundCost[];
}

export function createDefaultPersistedState(): PersistedState {
    return {
        version: 1,
        fanBalance: defaultFanBalance,
        gemBalance: defaultGemBalance,
        targetPulls: 15,
        mode: "balance",
        gemFanValue: defaultGemFanValue,
        costs: defaultCosts.map((cost) => ({ ...cost })),
    };
}

export function loadPersistedState(storage: Storage): PersistedState {
    const source = storage.getItem(storageKey);

    if (source === null) {
        return createDefaultPersistedState();
    }

    try {
        const parsed: unknown = JSON.parse(source);

        if (!isPersistedState(parsed)) {
            return createDefaultPersistedState();
        }

        return parsed;
    } catch {
        return createDefaultPersistedState();
    }
}

export function savePersistedState(
    storage: Storage,
    state: PersistedState,
): void {
    storage.setItem(storageKey, JSON.stringify(state));
}

function isPersistedState(value: unknown): value is PersistedState {
    if (!isRecord(value)) {
        return false;
    }

    const costs = value.costs;

    return (
        value.version === 1 &&
        isNonNegativeInteger(value.fanBalance) &&
        isNonNegativeInteger(value.gemBalance) &&
        isPullCount(value.targetPulls) &&
        isOptimizationMode(value.mode) &&
        isNonNegativeInteger(value.gemFanValue) &&
        Array.isArray(costs) &&
        isRoundCostArray(costs)
    );
}

function isRoundCostArray(value: unknown[]): value is RoundCost[] {
    const costs: RoundCost[] = [];

    for (const item of value) {
        if (!isRecord(item)) {
            return false;
        }

        if (
            !isPullCount(item.round) ||
            !isNonNegativeInteger(item.fans) ||
            !isNonNegativeInteger(item.gems)
        ) {
            return false;
        }

        costs.push({
            round: item.round,
            fans: item.fans,
            gems: item.gems,
        });
    }

    return validateCosts(costs).ok;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
    return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isPullCount(value: unknown): value is number {
    return (
        Number.isSafeInteger(value) && Number(value) >= 1 && Number(value) <= 15
    );
}
