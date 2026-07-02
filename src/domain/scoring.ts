import type { Candidate, OptimizerInput } from "./types";

export function compareCandidates(
    left: Candidate,
    right: Candidate,
    input: OptimizerInput,
): number {
    const leftMaxRate = Math.max(left.fanRate, left.gemRate);
    const rightMaxRate = Math.max(right.fanRate, right.gemRate);
    const leftRateDiff = Math.abs(left.fanRate - left.gemRate);
    const rightRateDiff = Math.abs(right.fanRate - right.gemRate);

    if (input.mode === "save-gems") {
        return compareMetrics(
            left.gemSpend,
            right.gemSpend,
            left.fanSpend,
            right.fanSpend,
            leftMaxRate,
            rightMaxRate,
            leftRateDiff,
            rightRateDiff,
            left.mask,
            right.mask,
        );
    }

    if (input.mode === "save-fans") {
        return compareMetrics(
            left.fanSpend,
            right.fanSpend,
            left.gemSpend,
            right.gemSpend,
            leftMaxRate,
            rightMaxRate,
            leftRateDiff,
            rightRateDiff,
            left.mask,
            right.mask,
        );
    }

    if (input.mode === "converted-cost") {
        return compareMetrics(
            left.fanSpend + left.gemSpend * input.gemFanValue,
            right.fanSpend + right.gemSpend * input.gemFanValue,
            leftMaxRate,
            rightMaxRate,
            leftRateDiff,
            rightRateDiff,
            left.gemSpend,
            right.gemSpend,
            left.fanSpend,
            right.fanSpend,
            left.mask,
            right.mask,
        );
    }

    return compareMetrics(
        leftMaxRate,
        rightMaxRate,
        leftRateDiff,
        rightRateDiff,
        left.fanRate + left.gemRate,
        right.fanRate + right.gemRate,
        left.gemSpend,
        right.gemSpend,
        left.fanSpend,
        right.fanSpend,
        left.mask,
        right.mask,
    );
}

export function selectTopCandidates(
    candidates: Candidate[],
    input: OptimizerInput,
    limit = 5,
): Candidate[] {
    const sortedCandidates = [...candidates].sort((left, right) =>
        compareCandidates(left, right, input),
    );
    const uniqueCandidates: Candidate[] = [];
    const seenSpendPairs = new Set<string>();

    for (const candidate of sortedCandidates) {
        const key = `${candidate.fanSpend}:${candidate.gemSpend}`;

        if (seenSpendPairs.has(key)) {
            continue;
        }

        seenSpendPairs.add(key);
        uniqueCandidates.push(candidate);

        if (uniqueCandidates.length >= limit) {
            break;
        }
    }

    return uniqueCandidates;
}

function compareMetrics(...values: number[]): number {
    for (let index = 0; index < values.length; index += 2) {
        const left = values[index] ?? 0;
        const right = values[index + 1] ?? 0;

        if (left < right) {
            return -1;
        }

        if (left > right) {
            return 1;
        }
    }

    return 0;
}
