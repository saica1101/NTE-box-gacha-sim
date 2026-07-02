import { describe, expect, test } from "vitest";
import { defaultCosts } from "../src/data/defaultCosts";
import { profileOptimization } from "../src/domain/benchmark";
import type { OptimizationMode, OptimizerInput } from "../src/domain/types";

const modes: OptimizationMode[] = [
    "balance",
    "save-gems",
    "save-fans",
    "converted-cost",
];

const baseInput: OptimizerInput = {
    fanBalance: 11_800_000,
    gemBalance: 5_980,
    targetPulls: 15,
    mode: "balance",
    gemFanValue: 2_000,
    costs: defaultCosts,
};

describe("performance", () => {
    test.each(modes)(
        "15回・32,768パターンの %s モードが10秒未満で完了する",
        (mode) => {
            const profile = profileOptimization({
                ...baseInput,
                mode,
            });

            console.info(
                [
                    profile.label,
                    `候補数=${profile.patternCount}`,
                    `購入可能=${profile.affordableCount}`,
                    `実計算回数=${profile.actualPulls}`,
                    `生成=${profile.generationElapsedMs.toFixed(2)}ms`,
                    `上位5=${profile.rankingElapsedMs.toFixed(2)}ms`,
                    `合計=${profile.totalElapsedMs.toFixed(2)}ms`,
                ].join(" / "),
            );

            expect(profile.totalElapsedMs).toBeLessThan(10_000);
        },
    );

    test("代表ケースをベンチマーク表示できる", () => {
        const cases: { label: string; input: OptimizerInput }[] = [
            {
                label: "標準バランス",
                input: baseInput,
            },
            {
                label: "少額・円石温存",
                input: {
                    ...baseInput,
                    fanBalance: 3_240_000,
                    gemBalance: 500,
                    mode: "save-gems",
                },
            },
            {
                label: "ファンスなし・ファンス温存",
                input: {
                    ...baseInput,
                    fanBalance: 0,
                    mode: "save-fans",
                },
            },
        ];

        const profiles = cases.map(({ label, input }) =>
            profileOptimization(input, label),
        );

        expect(profiles).toHaveLength(3);
        expect(
            profiles.every((profile) => profile.totalElapsedMs < 10_000),
        ).toBe(true);
    });
});
