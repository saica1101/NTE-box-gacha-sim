import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/style.css", "utf8");
const html = readFileSync("index.html", "utf8");

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

    test("上位5件テーブルのヘッダーを短くして1行表示にする", () => {
        expect(html).toContain('<th scope="col">消費ファンス</th>');
        expect(html).toContain('<th scope="col">消費円石</th>');
        expect(html).not.toContain('<th scope="col">ファンス消費</th>');
        expect(html).not.toContain('<th scope="col">円石消費</th>');
        expect(css).toContain("white-space: nowrap");
    });
});
