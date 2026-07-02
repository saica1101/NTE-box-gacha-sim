import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/style.css", "utf8");

describe("UI color contrast hooks", () => {
    test("選択中モードとテーブルヘッダーに専用の色トークンを使う", () => {
        expect(css).toContain("--mode-selected-bg");
        expect(css).toContain("--mode-selected-ink");
        expect(css).toContain("--table-head-bg");
        expect(css).toContain("--table-head-ink");
        expect(css).toContain("background: var(--mode-selected-bg)");
        expect(css).toContain("color: var(--mode-selected-ink)");
        expect(css).toContain("background: var(--table-head-bg)");
        expect(css).toContain("color: var(--table-head-ink)");
    });
});
