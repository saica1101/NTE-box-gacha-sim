import { describe, expect, test } from "vitest";
import { parseSharedInput } from "../src/utils/shareUrl";

describe("shareUrl", () => {
    test("URLSearchParamsの入力条件を検証済みで復元する", () => {
        const url = new URL(
            "https://example.test/app/?fans=11800000&gems=5980&pulls=15&mode=converted-cost&gemFanValue=2500",
        );

        const parsed = parseSharedInput(url);

        expect(parsed).toEqual({
            ok: true,
            value: {
                fanBalance: 11_800_000,
                gemBalance: 5_980,
                targetPulls: 15,
                mode: "converted-cost",
                gemFanValue: 2_500,
            },
        });
    });

    test("不正なURLパラメータは適用しない", () => {
        const url = new URL("https://example.test/?pulls=99&mode=unknown");

        const parsed = parseSharedInput(url);

        expect(parsed.ok).toBe(false);
    });
});
