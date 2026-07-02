import { describe, expect, test } from "vitest";
import { defaultCosts } from "../src/data/defaultCosts";
import { optimize } from "../src/domain/optimizer";
import type {
    Candidate,
    OptimizationMode,
    OptimizerInput,
    RoundCost,
} from "../src/domain/types";

const baseInput: OptimizerInput = {
    fanBalance: 11_800_000,
    gemBalance: 5_980,
    targetPulls: 15,
    mode: "balance",
    gemFanValue: 2_000,
    costs: defaultCosts,
};

function gemRounds(candidate: Candidate | null): number[] {
    if (candidate === null) {
        return [];
    }

    return Array.from({ length: 15 }, (_, index) => index + 1).filter(
        (round) => (candidate.mask & (1 << (round - 1))) !== 0,
    );
}

function fanRounds(candidate: Candidate | null): number[] {
    if (candidate === null) {
        return [];
    }

    return Array.from({ length: 15 }, (_, index) => index + 1).filter(
        (round) => (candidate.mask & (1 << (round - 1))) === 0,
    );
}

describe("optimize", () => {
    test("バランスモードで両通貨の消費率が最も近い候補を選ぶ", () => {
        const result = optimize(baseInput);

        expect(result.status).toBe("available");
        expect(result.actualPulls).toBe(15);
        expect(result.best?.fanSpend).toBe(5_600_000);
        expect(result.best?.gemSpend).toBe(2_850);
        expect(result.best?.fanRemain).toBe(6_200_000);
        expect(result.best?.gemRemain).toBe(3_130);
        expect(gemRounds(result.best)).toEqual([10, 11, 14, 15]);
        expect(result.best?.fanRate).toBeCloseTo(0.4746, 4);
        expect(result.best?.gemRate).toBeCloseTo(0.4766, 4);
    });

    test("円石を持っていない場合は全回ファンス払いを選ぶ", () => {
        const result = optimize({
            ...baseInput,
            gemBalance: 0,
        });

        expect(result.status).toBe("available");
        expect(result.actualPulls).toBe(15);
        expect(result.best?.fanSpend).toBe(11_800_000);
        expect(result.best?.gemSpend).toBe(0);
        expect(gemRounds(result.best)).toEqual([]);
    });

    test("ファンスを持っていない場合は全回円石払いを選ぶ", () => {
        const result = optimize({
            ...baseInput,
            fanBalance: 0,
        });

        expect(result.status).toBe("available");
        expect(result.actualPulls).toBe(15);
        expect(result.best?.fanSpend).toBe(0);
        expect(result.best?.gemSpend).toBe(5_980);
        expect(fanRounds(result.best)).toEqual([]);
    });

    test("円石500個のみでは最大5回まで円石払いで購入できる", () => {
        const result = optimize({
            ...baseInput,
            fanBalance: 0,
            gemBalance: 500,
        });

        expect(result.status).toBe("fallback");
        expect(result.actualPulls).toBe(5);
        expect(result.best?.gemSpend).toBe(500);
        expect(gemRounds(result.best)).toEqual([1, 2, 3, 4, 5]);
    });

    test("ファンス3,240,000のみでは最大9回までファンス払いで購入できる", () => {
        const result = optimize({
            ...baseInput,
            fanBalance: 3_240_000,
            gemBalance: 0,
        });

        expect(result.status).toBe("fallback");
        expect(result.actualPulls).toBe(9);
        expect(result.best?.fanSpend).toBe(2_600_000);
        expect(gemRounds(result.best)).toEqual([]);
    });

    test("両通貨が0の場合は1回も購入できない", () => {
        const result = optimize({
            ...baseInput,
            fanBalance: 0,
            gemBalance: 0,
        });

        expect(result.status).toBe("unavailable");
        expect(result.actualPulls).toBe(0);
        expect(result.best).toBeNull();
        expect(result.recommendations).toEqual([]);
    });

    test.each<OptimizationMode>([
        "balance",
        "save-gems",
        "save-fans",
        "converted-cost",
    ])("%s モードで上位5件が決定的に並ぶ", (mode) => {
        const first = optimize({
            ...baseInput,
            mode,
        });
        const second = optimize({
            ...baseInput,
            mode,
        });

        expect(first.recommendations.length).toBeLessThanOrEqual(5);
        expect(first.best).toMatchObject(first.recommendations[0] ?? {});
        expect(
            first.recommendations.map((candidate) => candidate.mask),
        ).toEqual(second.recommendations.map((candidate) => candidate.mask));

        const spendPairs = new Set(
            first.recommendations.map(
                (candidate) => `${candidate.fanSpend}:${candidate.gemSpend}`,
            ),
        );
        expect(spendPairs.size).toBe(first.recommendations.length);
    });
});

describe("optimize cross-check", () => {
    test("1〜15回の結果が独立した総当たり実装と一致する", () => {
        const modes: OptimizationMode[] = [
            "balance",
            "save-gems",
            "save-fans",
            "converted-cost",
        ];

        for (const mode of modes) {
            for (let targetPulls = 1; targetPulls <= 15; targetPulls += 1) {
                const input: OptimizerInput = {
                    ...baseInput,
                    targetPulls,
                    mode,
                    fanBalance: 3_240_000,
                    gemBalance: 1_700,
                };

                const result = optimize(input);
                const expected = bruteForce(input, defaultCosts);

                expect(result.actualPulls).toBe(expected.actualPulls);
                expect(result.status).toBe(expected.status);
                expect(result.best).toMatchObject(expected.best ?? {});
                expect(
                    result.recommendations.map((candidate) => ({
                        mask: candidate.mask,
                        fanSpend: candidate.fanSpend,
                        gemSpend: candidate.gemSpend,
                    })),
                ).toEqual(
                    expected.recommendations.map((candidate) => ({
                        mask: candidate.mask,
                        fanSpend: candidate.fanSpend,
                        gemSpend: candidate.gemSpend,
                    })),
                );
            }
        }
    });
});

function bruteForce(input: OptimizerInput, costs: RoundCost[]) {
    for (
        let actualPulls = input.targetPulls;
        actualPulls >= 1;
        actualPulls -= 1
    ) {
        const candidates: Candidate[] = [];
        const patternCount = 1 << actualPulls;

        for (let mask = 0; mask < patternCount; mask += 1) {
            let fanSpend = 0;
            let gemSpend = 0;

            for (let index = 0; index < actualPulls; index += 1) {
                if ((mask & (1 << index)) === 0) {
                    fanSpend += costs[index]?.fans ?? 0;
                } else {
                    gemSpend += costs[index]?.gems ?? 0;
                }
            }

            if (fanSpend > input.fanBalance || gemSpend > input.gemBalance) {
                continue;
            }

            candidates.push({
                mask,
                fanSpend,
                gemSpend,
                fanRemain: input.fanBalance - fanSpend,
                gemRemain: input.gemBalance - gemSpend,
                fanRate:
                    input.fanBalance === 0 ? 0 : fanSpend / input.fanBalance,
                gemRate:
                    input.gemBalance === 0 ? 0 : gemSpend / input.gemBalance,
            });
        }

        if (candidates.length === 0) {
            continue;
        }

        candidates.sort((left, right) => compareForMode(left, right, input));

        const uniqueCandidates: Candidate[] = [];
        const seen = new Set<string>();

        for (const candidate of candidates) {
            const key = `${candidate.fanSpend}:${candidate.gemSpend}`;

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            uniqueCandidates.push(candidate);
        }

        return {
            requestedPulls: input.targetPulls,
            actualPulls,
            status:
                actualPulls === input.targetPulls ? "available" : "fallback",
            best: uniqueCandidates[0] ?? null,
            recommendations: uniqueCandidates.slice(0, 5),
        };
    }

    return {
        requestedPulls: input.targetPulls,
        actualPulls: 0,
        status: "unavailable",
        best: null,
        recommendations: [],
    };
}

function compareForMode(
    left: Candidate,
    right: Candidate,
    input: OptimizerInput,
): number {
    const leftMax = Math.max(left.fanRate, left.gemRate);
    const rightMax = Math.max(right.fanRate, right.gemRate);
    const leftDiff = Math.abs(left.fanRate - left.gemRate);
    const rightDiff = Math.abs(right.fanRate - right.gemRate);

    if (input.mode === "save-gems") {
        return compareNumbers(
            left.gemSpend,
            right.gemSpend,
            left.fanSpend,
            right.fanSpend,
            leftMax,
            rightMax,
            leftDiff,
            rightDiff,
            left.mask,
            right.mask,
        );
    }

    if (input.mode === "save-fans") {
        return compareNumbers(
            left.fanSpend,
            right.fanSpend,
            left.gemSpend,
            right.gemSpend,
            leftMax,
            rightMax,
            leftDiff,
            rightDiff,
            left.mask,
            right.mask,
        );
    }

    if (input.mode === "converted-cost") {
        return compareNumbers(
            left.fanSpend + left.gemSpend * input.gemFanValue,
            right.fanSpend + right.gemSpend * input.gemFanValue,
            leftMax,
            rightMax,
            leftDiff,
            rightDiff,
            left.gemSpend,
            right.gemSpend,
            left.fanSpend,
            right.fanSpend,
            left.mask,
            right.mask,
        );
    }

    return compareNumbers(
        leftMax,
        rightMax,
        leftDiff,
        rightDiff,
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

function compareNumbers(...values: number[]): number {
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
