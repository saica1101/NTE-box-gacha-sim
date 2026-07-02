import type {
    Candidate,
    OptimizationResult,
    OptimizerInput,
} from "../domain/types";
import { formatRounds } from "../utils/format";
import { formatNumber, formatPercent } from "../utils/numbers";
import type { AppElements } from "./elements";
import type { FormErrors } from "./form";

export function renderFormErrors(
    elements: AppElements,
    errors: FormErrors,
): void {
    setText(elements.fanBalanceError, errors.fanBalance ?? "");
    setText(elements.gemBalanceError, errors.gemBalance ?? "");
    setText(elements.gemFanValueError, errors.gemFanValue ?? "");
    setText(elements.costError, errors.costs[0] ?? "");
    setText(elements.formErrorSummary, errors.summary.join("\n"));
    elements.submitButton.disabled = errors.summary.length > 0;
}

export function renderNotice(
    elements: AppElements,
    message: string,
    options: { isStale: boolean } = { isStale: false },
): void {
    const visibleMessage = options.isStale
        ? `前回の試算結果です。${message}`
        : message;

    setText(elements.statusMessage, visibleMessage);
    elements.resultRegion.setAttribute("aria-busy", "false");
    elements.resultContent.classList.toggle("is-stale", options.isStale);
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = options.isStale
        ? "再試算する"
        : "試算する";
}

export function renderCalculating(elements: AppElements): void {
    elements.submitButton.disabled = true;
    elements.submitButton.textContent = "計算中…";
    elements.resultRegion.setAttribute("aria-busy", "true");
    elements.resultContent.hidden = true;
    elements.resultContent.classList.remove("is-stale");
    setText(elements.statusMessage, "計算中…");
}

export function renderError(elements: AppElements, message: string): void {
    elements.resultRegion.setAttribute("aria-busy", "false");
    elements.resultContent.hidden = true;
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = "試算する";
    setText(elements.statusMessage, message);
}

export function renderResult(
    elements: AppElements,
    input: OptimizerInput,
    result: OptimizationResult,
    totalElapsedMs: number,
): void {
    elements.resultRegion.setAttribute("aria-busy", "false");
    elements.resultContent.hidden = false;
    elements.resultContent.classList.remove("is-stale");
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = "再試算する";

    setText(
        elements.statusMessage,
        `試算完了：${totalElapsedMs.toFixed(1)}ms（最適化 ${result.calculationElapsedMs.toFixed(1)}ms）`,
    );

    if (result.status === "unavailable") {
        renderUnavailable(elements);
        return;
    }

    renderFallbackMessage(elements, result);
    renderMetrics(elements, result);
    renderRoundBreakdown(elements, result);
    renderTopCandidates(elements, result);
    renderPaymentDetails(elements, input, result.best, result.actualPulls);
    elements.resultHeading.focus({ preventScroll: true });
}

function renderUnavailable(elements: AppElements): void {
    setText(elements.fallbackMessage, "現在の所持通貨では1回も引けません。");
    elements.resultMetrics.replaceChildren();
    setText(elements.gemRounds, "なし");
    setText(elements.fanRounds, "なし");
    elements.topCandidatesBody.replaceChildren();
    setText(elements.topCandidatesEmpty, "表示できる候補はありません。");
    elements.paymentDetailBody.replaceChildren();
    setText(elements.paymentDetailEmpty, "支払い詳細はありません。");
}

function renderFallbackMessage(
    elements: AppElements,
    result: OptimizationResult,
): void {
    if (result.status === "fallback") {
        setText(
            elements.fallbackMessage,
            `指定${result.requestedPulls}回は購入できません。現在の所持量では最大${result.actualPulls}回まで購入できます。`,
        );
        return;
    }

    setText(
        elements.fallbackMessage,
        `指定${result.requestedPulls}回を購入できます。`,
    );
}

function renderMetrics(
    elements: AppElements,
    result: OptimizationResult,
): void {
    const best = result.best;

    if (best === null) {
        elements.resultMetrics.replaceChildren();
        return;
    }

    const metrics = [
        ["判定", statusLabel(result.status)],
        ["指定回数", `${result.requestedPulls}回`],
        ["実際に計算した回数", `${result.actualPulls}回`],
        ["ファンス消費", formatNumber(best.fanSpend)],
        ["円石消費", formatNumber(best.gemSpend)],
        ["残ファンス", formatNumber(best.fanRemain)],
        ["残円石", formatNumber(best.gemRemain)],
        ["ファンス消費率", formatPercent(best.fanRate)],
        ["円石消費率", formatPercent(best.gemRate)],
        ["計算候補数", formatNumber(result.stats.patternCount)],
    ];
    const nodes = metrics.flatMap(([label, value]) => {
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        return [term, description];
    });

    elements.resultMetrics.replaceChildren(...nodes);
}

function renderRoundBreakdown(
    elements: AppElements,
    result: OptimizationResult,
): void {
    setText(
        elements.gemRounds,
        formatRounds(result.best, "gems", result.actualPulls),
    );
    setText(
        elements.fanRounds,
        formatRounds(result.best, "fans", result.actualPulls),
    );
}

function renderTopCandidates(
    elements: AppElements,
    result: OptimizationResult,
): void {
    const rows = result.recommendations.map((candidate, index) => {
        const row = document.createElement("tr");
        const cells = [
            { label: "順位", value: `${index + 1}` },
            { label: "消費ファンス", value: formatNumber(candidate.fanSpend) },
            { label: "消費円石", value: formatNumber(candidate.gemSpend) },
            { label: "残ファンス", value: formatNumber(candidate.fanRemain) },
            { label: "残円石", value: formatNumber(candidate.gemRemain) },
            {
                label: "ファンス消費率",
                value: formatPercent(candidate.fanRate),
            },
            { label: "円石消費率", value: formatPercent(candidate.gemRate) },
            {
                label: "円石払い回",
                value: formatRounds(candidate, "gems", result.actualPulls),
            },
        ];

        appendLabeledCells(row, cells);

        return row;
    });

    elements.topCandidatesBody.replaceChildren(...rows);
    setText(
        elements.topCandidatesEmpty,
        rows.length === 0 ? "表示できる候補はありません。" : "",
    );
}

function renderPaymentDetails(
    elements: AppElements,
    input: OptimizerInput,
    candidate: Candidate | null,
    actualPulls: number,
): void {
    if (candidate === null) {
        elements.paymentDetailBody.replaceChildren();
        setText(elements.paymentDetailEmpty, "支払い詳細はありません。");
        return;
    }

    const rows = Array.from({ length: actualPulls }, (_, index) => {
        const round = index + 1;
        const cost = input.costs.at(index);
        const isGemPayment = (candidate.mask & (1 << index)) !== 0;
        const row = document.createElement("tr");
        const cells = [
            { label: "回数", value: `${round}回目` },
            {
                label: "支払い方法",
                value: isGemPayment ? "円石払い" : "ファンス払い",
            },
            {
                label: "必要ファンス",
                value: isGemPayment ? "—" : formatNumber(cost?.fans ?? 0),
            },
            {
                label: "必要円石",
                value: isGemPayment ? formatNumber(cost?.gems ?? 0) : "—",
            },
        ];

        appendLabeledCells(row, cells);

        return row;
    });

    elements.paymentDetailBody.replaceChildren(...rows);
    setText(elements.paymentDetailEmpty, "");
}

function statusLabel(status: OptimizationResult["status"]): string {
    if (status === "available") {
        return "指定回数を購入可能";
    }

    if (status === "fallback") {
        return "指定回数は不足、最大回数で試算";
    }

    return "購入不可";
}

function setText(element: HTMLElement, value: string): void {
    element.textContent = value;
}

function appendLabeledCells(
    row: HTMLTableRowElement,
    cells: { label: string; value: string }[],
): void {
    cells.forEach(({ label, value }) => {
        const cell = document.createElement("td");
        cell.dataset.label = label;
        cell.textContent = value;
        row.append(cell);
    });
}
