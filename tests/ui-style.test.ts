import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/style.css", "utf8");
const html = readFileSync("index.html", "utf8");
const elementsTs = readFileSync("src/ui/elements.ts", "utf8");
const formTs = readFileSync("src/ui/form.ts", "utf8");
const mainTs = readFileSync("src/main.ts", "utf8");
const renderTs = readFileSync("src/ui/render.ts", "utf8");
const shareUrlTs = readFileSync("src/utils/shareUrl.ts", "utf8");

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

    test("output内の表はカード幅に収まり、狭い幅では行内ラベルを表示する", () => {
        expect(html).toContain('class="table-wrap result-table-wrap"');
        expect(html).toContain(
            '<table class="result-table top-candidates-table">',
        );
        expect(html).toContain(
            '<table class="result-table payment-detail-table">',
        );
        expect(css).toContain(".result-panel .table-wrap");
        expect(css).toContain("overflow-x: visible");
        expect(css).toContain(".result-table");
        expect(css).toContain("min-width: 0");
        expect(css).toContain("table-layout: fixed");
        expect(css).toContain("container-type: inline-size");
        expect(css).toContain("@container");
        expect(css).toContain("content: attr(data-label)");
        expect(renderTs).toContain("cell.dataset.label = label");
    });

    test("inputとoutputは常時1カラムで縦方向に並べる", () => {
        expect(css).toMatch(
            /\.app-shell\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
        );
        expect(css).not.toContain(
            "grid-template-columns: minmax(280px, 420px) minmax(0, 1fr)",
        );
    });

    test("条件共有ボタンと共有URL作成処理を表示しない", () => {
        expect(html).not.toContain('id="share-button"');
        expect(html).not.toContain('id="share-status"');
        expect(html).not.toContain("条件を共有");
        expect(elementsTs).not.toContain("shareButton");
        expect(elementsTs).not.toContain("shareStatus");
        expect(mainTs).not.toContain("createShareUrl");
        expect(mainTs).not.toContain("copyText");
        expect(mainTs).not.toContain("navigator.clipboard");
        expect(shareUrlTs).not.toContain("createShareUrl");
        expect(css).not.toContain(".copy-buffer");
    });

    test("output内の数値セルは右揃えで、結果表の文字サイズを統一する", () => {
        expect(css).toContain("--result-table-font-size");
        expect(css).toContain("font-size: var(--result-table-font-size)");
        expect(css).toContain(".result-table .number-cell");
        expect(css).toContain("font-variant-numeric: tabular-nums");
        expect(css).toContain("text-align: right");
        expect(renderTs).toContain('variant: "number"');
        expect(renderTs).toContain('cell.classList.add("number-cell")');
        expect(css).not.toContain(".payment-detail-table {\n    font-size");
    });

    test("詳細設定はモーダル内の1カラム編集リストで表示する", () => {
        expect(html).toContain('id="open-costs-button"');
        expect(html).toContain("<dialog");
        expect(html).toContain('id="cost-settings-dialog"');
        expect(html).toContain('id="cost-list"');
        expect(html).not.toContain("<details");
        expect(html).not.toContain('id="cost-table-body"');
        expect(css).toContain(".settings-dialog");
        expect(css).toContain(".cost-list");
        expect(css).toContain("overflow-y: auto");
        expect(css).toContain("grid-template-columns: 1fr");
        expect(formTs).toContain('row.className = "cost-row"');
    });
});
