import { describe, expect, test } from "vitest";
import {
    parseIntegerInput,
    validateCosts,
    validateOptimizerInput,
} from "../src/domain/validation";
import { defaultCosts } from "../src/data/defaultCosts";

describe("parseIntegerInput", () => {
    test("カンマと全角数字を正規化して0以上の整数として読む", () => {
        const result = parseIntegerInput(
            "　１１,８００,０００　",
            "所持ファンス",
        );

        expect(result).toEqual({
            ok: true,
            value: 11_800_000,
        });
    });

    test.each([
        ["-1", "0以上の整数"],
        ["1.5", "小数"],
        ["abc", "数値"],
        ["", "入力してください"],
    ])("不正な値 %s を具体的なエラーにする", (source, keyword) => {
        const result = parseIntegerInput(source, "所持円石");

        expect(result.ok).toBe(false);

        if (!result.ok) {
            expect(result.error).toContain(keyword);
        }
    });
});

describe("validateOptimizerInput", () => {
    test("正しい入力を受け入れる", () => {
        const result = validateOptimizerInput({
            fanBalance: 11_800_000,
            gemBalance: 5_980,
            targetPulls: 15,
            mode: "balance",
            gemFanValue: 2_000,
            costs: defaultCosts,
        });

        expect(result.ok).toBe(true);
    });

    test("対象回数と換算値の異常を検出する", () => {
        const result = validateOptimizerInput({
            fanBalance: 1,
            gemBalance: 1,
            targetPulls: 16,
            mode: "converted-cost",
            gemFanValue: -1,
            costs: defaultCosts,
        });

        expect(result.ok).toBe(false);

        if (!result.ok) {
            expect(result.errors).toContain(
                "引きたい回数は1〜15で選択してください。",
            );
            expect(result.errors).toContain(
                "円石換算値は0以上の整数で入力してください。",
            );
        }
    });
});

describe("validateCosts", () => {
    test("15回分の0以上の整数コストを受け入れる", () => {
        expect(validateCosts(defaultCosts).ok).toBe(true);
    });

    test("不足したコスト表を拒否する", () => {
        const result = validateCosts(defaultCosts.slice(0, 14));

        expect(result.ok).toBe(false);
    });
});
