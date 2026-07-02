import { generateCandidates } from "./candidateGenerator";
import { selectTopCandidates } from "./scoring";
import type { OptimizationResult, OptimizerInput } from "./types";
import { validateOptimizerInput } from "./validation";

export function optimize(input: OptimizerInput): OptimizationResult {
    const validation = validateOptimizerInput(input);

    if (!validation.ok) {
        throw new Error(validation.errors.join("\n"));
    }

    const startedAt = performance.now();
    let patternCount = 0;
    let rankingElapsedMs = 0;

    for (
        let actualPulls = input.targetPulls;
        actualPulls >= 1;
        actualPulls -= 1
    ) {
        const generation = generateCandidates(input, actualPulls);
        patternCount += generation.patternCount;

        if (generation.candidates.length === 0) {
            continue;
        }

        const rankingStartedAt = performance.now();
        const recommendations = selectTopCandidates(
            generation.candidates,
            input,
        );
        rankingElapsedMs += performance.now() - rankingStartedAt;

        return {
            requestedPulls: input.targetPulls,
            actualPulls,
            status:
                actualPulls === input.targetPulls ? "available" : "fallback",
            best: recommendations[0] ?? null,
            recommendations,
            calculationElapsedMs: performance.now() - startedAt,
            stats: {
                patternCount,
                affordableCount: generation.candidates.length,
                rankingElapsedMs,
            },
        };
    }

    return {
        requestedPulls: input.targetPulls,
        actualPulls: 0,
        status: "unavailable",
        best: null,
        recommendations: [],
        calculationElapsedMs: performance.now() - startedAt,
        stats: {
            patternCount,
            affordableCount: 0,
            rankingElapsedMs,
        },
    };
}
