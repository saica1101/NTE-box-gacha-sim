import { generateCandidates } from "./candidateGenerator";
import { selectTopCandidates } from "./scoring";
import type { OptimizerInput } from "./types";
import { validateOptimizerInput } from "./validation";

export interface OptimizationProfile {
    label: string;
    patternCount: number;
    affordableCount: number;
    actualPulls: number;
    generationElapsedMs: number;
    rankingElapsedMs: number;
    totalElapsedMs: number;
}

export function profileOptimization(
    input: OptimizerInput,
    label: string = input.mode,
): OptimizationProfile {
    const validation = validateOptimizerInput(input);

    if (!validation.ok) {
        throw new Error(validation.errors.join("\n"));
    }

    const totalStartedAt = performance.now();
    let patternCount = 0;
    let affordableCount = 0;
    let actualPulls = 0;
    let generationElapsedMs = 0;
    let rankingElapsedMs = 0;

    for (let pulls = input.targetPulls; pulls >= 1; pulls -= 1) {
        const generationStartedAt = performance.now();
        const generation = generateCandidates(input, pulls);
        generationElapsedMs += performance.now() - generationStartedAt;
        patternCount += generation.patternCount;

        if (generation.candidates.length === 0) {
            continue;
        }

        const rankingStartedAt = performance.now();
        selectTopCandidates(generation.candidates, input);
        rankingElapsedMs += performance.now() - rankingStartedAt;
        affordableCount = generation.candidates.length;
        actualPulls = pulls;
        break;
    }

    return {
        label,
        patternCount,
        affordableCount,
        actualPulls,
        generationElapsedMs,
        rankingElapsedMs,
        totalElapsedMs: performance.now() - totalStartedAt,
    };
}
