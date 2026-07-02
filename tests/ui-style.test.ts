import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/style.css", "utf8");
const html = readFileSync("index.html", "utf8");
const elementsTs = readFileSync("src/ui/elements.ts", "utf8");
const formTs = readFileSync("src/ui/form.ts", "utf8");
const mainTs = readFileSync("src/main.ts", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const renderTs = readFileSync("src/ui/render.ts", "utf8");
const shareUrlTs = readFileSync("src/utils/shareUrl.ts", "utf8");

describe("UI color contrast hooks", () => {
    test("ページタイトルとプロジェクト名をNTE ボックスガチャシミュへ統一する", () => {
        expect(html).toContain("<title>NTE ボックスガチャシミュ</title>");
        expect(html).toContain("<h1>NTE ボックスガチャシミュ</h1>");
        expect(html).not.toContain("Draco Box 支払い試算");
        expect(packageJson).toContain('"name": "nte-box-gacha-sim"');
    });

    test("ページ左上のタイトルは省略せず1行で表示する", () => {
        const titleRule = /h1\s*{[^}]*}/s.exec(css)?.[0];

        expect(titleRule).toContain("white-space: nowrap");
        expect(titleRule).toContain("overflow-wrap: normal");
        expect(titleRule).toContain("word-break: keep-all");
        expect(titleRule).not.toContain("text-overflow: ellipsis");
        expect(css).not.toContain("text-overflow: ellipsis");
        expect(css).not.toContain("min-width: 320px");
    });

    test("計算後はoutputへ移動し、右下の丸型ボタンからinputへ戻れる", () => {
        expect(html).toContain('id="back-to-top-button"');
        expect(html).toContain('aria-label="入力欄へ戻る"');
        expect(elementsTs).toContain("inputSection");
        expect(elementsTs).toContain("backToTopButton");
        expect(mainTs).toContain("scrollToOutput");
        expect(mainTs).toContain("scrollToInput");
        expect(mainTs).toContain("scrollIntoView");
        expect(css).toContain(".scroll-top-button");
        expect(css).toContain("position: fixed");
        expect(css).toContain("border-radius: 999px");
    });

    test("選択中モードに専用の色トークンを使い、結果テーブルのヘッダーは控えめにする", () => {
        expect(css).toContain("--mode-selected-bg");
        expect(css).toContain("--mode-selected-ink");
        expect(css).toContain("background: var(--mode-selected-bg)");
        expect(css).toContain("color: var(--mode-selected-ink)");
        expect(css).toMatch(
            /\.result-table thead th\s*{[^}]*background:\s*transparent/s,
        );
        expect(css).toMatch(
            /\.result-table thead th\s*{[^}]*color:\s*var\(--ink-soft\)/s,
        );
    });

    test("上位5件テーブルのヘッダーを短くして1行表示にする", () => {
        expect(html).toContain('<th scope="col">消費ファンス</th>');
        expect(html).toContain('<th scope="col">消費円石</th>');
        expect(html).not.toContain('<th scope="col">ファンス消費</th>');
        expect(html).not.toContain('<th scope="col">円石消費</th>');
        expect(css).toContain("white-space: nowrap");
    });

    test("上位5件テーブルに消費率列を表示しない", () => {
        expect(html).not.toContain('<th scope="col">ファンス消費率</th>');
        expect(html).not.toContain('<th scope="col">円石消費率</th>');
        expect(renderTs).not.toContain('label: "ファンス消費率"');
        expect(renderTs).not.toContain('label: "円石消費率"');
    });

    test("6列化した上位5件テーブルの密度を読みやすく整える", () => {
        expect(css).toContain("--result-table-font-size: 0.9rem");
        expect(css).toContain("padding: 14px 18px");
        expect(css).toMatch(
            /\.top-candidates-table th:nth-child\(6\),\s*\.top-candidates-table td:nth-child\(6\)\s*{\s*width:\s*30%/s,
        );
        expect(css).not.toContain("width: 38%");
    });

    test("outputの要約は購入可否と消費量と残量だけを見せる", () => {
        expect(html).toContain('class="status-alert"');
        expect(html).toContain('class="status-detail"');
        expect(html).toContain(
            '<dl id="result-metrics" class="outcome-summary"></dl>',
        );
        expect(css).toContain(".outcome-summary");
        expect(css).toContain(".outcome-summary-item");
        expect(css).toContain(".outcome-summary-item.is-primary");
        expect(renderTs).toContain('label: "判定結果"');
        expect(renderTs).toContain('label: "消費コスト"');
        expect(renderTs).toContain('label: "残高情報"');
        expect(renderTs).toContain('label: "ファンス消費"');
        expect(renderTs).toContain('label: "円石消費"');
        expect(renderTs).toContain('label: "残ファンス"');
        expect(renderTs).toContain('label: "残円石"');
        expect(renderTs).toContain('variant: "cost"');
        expect(renderTs).toContain('variant: "balance"');
        expect(renderTs).toContain("result-number");
        expect(renderTs).not.toContain('label: "消費後残量"');
        expect(renderTs).not.toContain('label: "指定回数"');
        expect(renderTs).not.toContain('label: "実際に計算した回数"');
        expect(renderTs).not.toContain('label: "計算候補数"');
        expect(renderTs).not.toContain('label: "ファンス消費率"');
        expect(renderTs).not.toContain('label: "円石消費率"');
        expect(renderTs).toContain("試算が完了しました。");
        expect(renderTs).not.toContain(
            "`指定${result.requestedPulls}回を購入できます。`",
        );
        expect(renderTs).not.toContain(
            "現在の所持量では最大${result.actualPulls}回まで購入できます。",
        );
        expect(renderTs).not.toContain("試算完了：${totalElapsedMs");
    });

    test("output要約はアラートと3カードのダッシュボードUIにする", () => {
        const accentRule = /\.outcome-summary-item::before\s*{[^}]*}/s.exec(
            css,
        )?.[0];

        expect(css).toContain(".status-alert");
        expect(css).toContain("border-left: 4px solid var(--signal)");
        expect(css).toContain(".outcome-summary-item.is-primary");
        expect(css).toContain(".outcome-summary-item::before");
        expect(css).toMatch(
            /\.outcome-summary-item\s*{[^}]*overflow:\s*hidden/s,
        );
        expect(accentRule).toContain("left: -1px");
        expect(accentRule).toContain("top: -1px");
        expect(accentRule).toContain("bottom: -1px");
        expect(accentRule).toContain("border-radius: 0");
        expect(accentRule).toContain("background: var(--signal)");
        expect(css).not.toContain("border-top: 4px solid var(--signal)");
        expect(css).toContain(".result-highlight");
        expect(css).toContain(".result-number");
        expect(css).toContain(".metric-rows");
        expect(css).toContain(".metric-row");
        expect(css).toContain(".metric-value");
        expect(css).not.toContain("border-left: 4px solid var(--steel)");
        expect(renderTs).not.toContain("📊");
        expect(renderTs).not.toContain("📉");
        expect(renderTs).not.toContain("💼");
    });

    test("上位5件テーブルの円石払い回ヘッダーを中央揃えにする", () => {
        expect(css).toMatch(
            /\.top-candidates-table th:nth-child\(6\)\s*{[^}]*text-align:\s*center/s,
        );
    });

    test("支払い回の内訳はタグUIで表示する", () => {
        expect(css).toContain(".round-pairs");
        expect(css).toContain(".round-pair-row");
        expect(css).toContain(".round-tag-list");
        expect(css).toContain(".round-tag");
        expect(renderTs).toContain("renderRoundTags");
        expect(renderTs).toContain("round-tag is-gems");
        expect(renderTs).toContain("round-tag is-fans");
    });

    test("output要約は判定、消費、残高の3カラムにする", () => {
        expect(css).toMatch(
            /\.outcome-summary-item:nth-child\(2\)\s*{[^}]*grid-column:\s*2/s,
        );
        expect(css).toMatch(
            /\.outcome-summary-item:nth-child\(3\)\s*{[^}]*grid-column:\s*3/s,
        );
        expect(css).not.toContain(".outcome-summary-item:nth-child(4)");
    });

    test("output要約の消費と残高の数値は右端で桁を揃える", () => {
        expect(css).toMatch(
            /\.metric-value\s*{[^}]*text-align:\s*right[^}]*font-variant-numeric:\s*tabular-nums/s,
        );
        expect(css).toContain(".metric-value.is-zero");
    });

    test("モバイル幅ではoutput要約の明示配置を解除して1カラムに戻す", () => {
        const mobileCss = css.slice(css.indexOf("@media (max-width: 560px)"));

        expect(mobileCss).toMatch(
            /\.outcome-summary-item:nth-child\(n\)\s*{[^}]*grid-column:\s*auto[^}]*grid-row:\s*auto/s,
        );
    });

    test("output内の表はカード幅に収まり、狭い幅では行内ラベルを表示する", () => {
        expect(html).toContain(
            'class="table-wrap result-table-wrap table-card"',
        );
        expect(html).toContain(
            '<table class="result-table top-candidates-table">',
        );
        expect(html).toContain(
            '<table class="result-table payment-detail-table">',
        );
        expect(css).toContain(".result-panel .table-wrap");
        expect(css).toContain("overflow-x: visible");
        expect(css).toContain(".table-card");
        expect(css).toContain(".rank-number");
        expect(css).toContain(".rank-1");
        expect(css).toContain(".num-val");
        expect(css).toContain(".table-text-muted");
        expect(css).toContain(".result-table");
        expect(css).toContain("min-width: 0");
        expect(css).toContain("table-layout: fixed");
        expect(css).toContain("container-type: inline-size");
        expect(css).toContain("@container");
        expect(css).toContain("content: attr(data-label)");
        expect(renderTs).toContain("cell.dataset.label = label");
        expect(renderTs).toContain("rank-number");
        expect(renderTs).toContain("rank-1");
        expect(renderTs).toContain("num-val");
        expect(renderTs).toContain("table-text-muted");
        expect(html).toContain('<h3 id="detail-heading">1位の各回支払い</h3>');
    });

    test("400px幅のカード表示では結果テーブルをモバイルカードとして整える", () => {
        const containerCss = css.slice(css.indexOf("@container"));

        expect(containerCss).toMatch(
            /\.top-candidates-table td:nth-child\(n\)\s*{[^}]*width:\s*100%/s,
        );
        expect(containerCss).toMatch(
            /\.result-table caption\s*{[^}]*display:\s*block[^}]*width:\s*100%[^}]*white-space:\s*normal/s,
        );
        expect(containerCss).toMatch(
            /\.top-candidates-table tr\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
        );
        expect(containerCss).toMatch(
            /\.top-candidates-table td:nth-child\(1\)\s*{[^}]*grid-column:\s*1\s*\/\s*-1/s,
        );
        expect(containerCss).toMatch(
            /\.payment-detail-table tr\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
        );
        expect(containerCss).toContain(".top-candidates-table td:nth-child(6)");
        expect(containerCss).toMatch(
            /\.top-candidates-table td:nth-child\(6\)\s*{[^}]*grid-column:\s*1\s*\/\s*-1[^}]*display:\s*grid/s,
        );
        expect(containerCss).toMatch(
            /\.top-candidates-table td:nth-child\(6\)::before\s*{[^}]*white-space:\s*nowrap/s,
        );
        expect(containerCss).toContain(".payment-detail-table td:nth-child(2)");
    });

    test("inputとoutputは常時1カラムで縦方向に並べる", () => {
        expect(css).toMatch(
            /\.app-shell\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
        );
        expect(css).not.toContain(
            "grid-template-columns: minmax(280px, 420px) minmax(0, 1fr)",
        );
    });

    test("対象ボックスガチャをドロップダウンで選択できる", () => {
        expect(html).toContain(
            '<label for="box-gacha">対象ボックスガチャ</label>',
        );
        expect(html).toContain('id="box-gacha"');
        expect(html).toContain('name="boxGacha"');
        expect(elementsTs).toContain("boxGachaSelect");
        expect(css).toContain(".gacha-select-field");
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
