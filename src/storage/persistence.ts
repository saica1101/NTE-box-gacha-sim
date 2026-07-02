import {
    defaultFanBalance,
    defaultGemBalance,
    defaultGemFanValue,
    defaultCosts,
} from "../data/defaultCosts";
import { defaultBoxGachaId, getBoxGachaById } from "../data/boxGachas";
import type { OptimizationMode, RoundCost } from "../domain/types";
import { isOptimizationMode, validateCosts } from "../domain/validation";

export const storageKey = "nte-box-gacha-sim";
const legacyStorageKey = "nte-draco-box-sim";

export interface PersistedState {
    version: 1;
    boxGachaId: string;
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
        boxGachaId: defaultBoxGachaId,
        fanBalance: defaultFanBalance,
        gemBalance: defaultGemBalance,
        targetPulls: 15,
        mode: "balance",
        gemFanValue: defaultGemFanValue,
        costs: defaultCosts.map((cost) => ({ ...cost })),
    };
}

export function loadPersistedState(storage: Storage): PersistedState {
    const source =
        storage.getItem(storageKey) ?? storage.getItem(legacyStorageKey);

    if (source === null) {
        return createDefaultPersistedState();
    }

    try {
        const parsed: unknown = JSON.parse(source);

        const persistedState = toPersistedState(parsed);

        if (persistedState === null) {
            return createDefaultPersistedState();
        }

        return persistedState;
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

function toPersistedState(value: unknown): PersistedState | null {
    if (!isRecord(value)) {
        return null;
    }

    const boxGachaId = value.boxGachaId;
    const fanBalance = value.fanBalance;
    const gemBalance = value.gemBalance;
    const targetPulls = value.targetPulls;
    const mode = value.mode;
    const gemFanValue = value.gemFanValue;
    const costs = value.costs;

    if (
        value.version === 1 &&
        isNonNegativeInteger(fanBalance) &&
        isNonNegativeInteger(gemBalance) &&
        isPullCount(targetPulls) &&
        isOptimizationMode(mode) &&
        isNonNegativeInteger(gemFanValue) &&
        Array.isArray(costs) &&
        isRoundCostArray(costs)
    ) {
        return {
            version: 1,
            boxGachaId:
                typeof boxGachaId === "string" &&
                getBoxGachaById(boxGachaId) !== undefined
                    ? boxGachaId
                    : defaultBoxGachaId,
            fanBalance,
            gemBalance,
            targetPulls,
            mode,
            gemFanValue,
            costs,
        };
    }

    return null;
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
