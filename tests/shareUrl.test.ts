import { describe, expect, test } from "vitest";
import { defaultCosts } from "../src/data/defaultCosts";
import { createShareUrl, parseSharedInput } from "../src/utils/shareUrl";

describe("shareUrl", () => {
    test("入力条件をURLSearchParamsへ保存して検証済みで復元する", () => {
        const source = new URL("https://example.test/app/");
        const url = createShareUrl(source, {
            fanBalance: 11_800_000,
            gemBalance: 5_980,
            targetPulls: 15,
            mode: "converted-cost",
            gemFanValue: 2_500,
            costs: defaultCosts,
        });

        const parsed = parseSharedInput(new URL(url));

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
