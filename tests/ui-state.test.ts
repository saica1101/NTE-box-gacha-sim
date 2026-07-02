import { describe, expect, test, vi } from "vitest";
import { createCalculatorController } from "../src/ui/state";
import { defaultCosts } from "../src/data/defaultCosts";
import type { OptimizerInput } from "../src/domain/types";

const input: OptimizerInput = {
    fanBalance: 11_800_000,
    gemBalance: 5_980,
    targetPulls: 15,
    mode: "balance",
    gemFanValue: 2_000,
    costs: defaultCosts,
};

describe("calculator controller", () => {
    test("入力変更だけでは最適化を実行せずdirtyになる", async () => {
        const optimize = vi.fn();
        const controller = createCalculatorController({
            readInput: () => ({ ok: true, value: input }),
            optimize,
        });

        controller.markInputChanged(
            "条件が変更されています。試算ボタンを押してください。",
        );

        expect(controller.getState().phase).toBe("dirty");
        expect(optimize).not.toHaveBeenCalled();

        await controller.submit();

        expect(optimize).toHaveBeenCalledTimes(1);
    });
});
