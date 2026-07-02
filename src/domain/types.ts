export type OptimizationMode =
    "balance" | "save-gems" | "save-fans" | "converted-cost";

export interface RoundCost {
    round: number;
    fans: number;
    gems: number;
}

export interface OptimizerInput {
    fanBalance: number;
    gemBalance: number;
    targetPulls: number;
    mode: OptimizationMode;
    gemFanValue: number;
    costs: RoundCost[];
}

export interface PaymentState {
    mask: number;
    fanSpend: number;
    gemSpend: number;
}

export interface Candidate extends PaymentState {
    fanRemain: number;
    gemRemain: number;
    fanRate: number;
    gemRate: number;
}

export interface OptimizationStats {
    patternCount: number;
    affordableCount: number;
    rankingElapsedMs: number;
}

export interface OptimizationResult {
    requestedPulls: number;
    actualPulls: number;
    status: "available" | "fallback" | "unavailable";
    best: Candidate | null;
    recommendations: Candidate[];
    calculationElapsedMs: number;
    stats: OptimizationStats;
}

export interface AppState {
    phase:
        "idle" | "dirty" | "validating" | "calculating" | "success" | "error";
    lastInput: OptimizerInput | null;
    result: OptimizationResult | null;
    errorMessage: string | null;
    noticeMessage: string | null;
}

export const optimizationModes = [
    "balance",
    "save-gems",
    "save-fans",
    "converted-cost",
] as const satisfies readonly OptimizationMode[];
