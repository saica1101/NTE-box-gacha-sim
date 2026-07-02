import type {
    Candidate,
    OptimizationResult,
    OptimizerInput,
} from "../domain/types";
import { formatRounds } from "../utils/format";
import { formatNumber } from "../utils/numbers";
import type { AppElements } from "./elements";
import type { FormErrors } from "./form";

interface OutcomeMetric {
    label: string;
    value?: string;
    isPrimary?: boolean;
    variant?: "balance";
    details?: {
        label: string;
        value: string;
    }[];
}

interface ResultCell {
    label: string;
    value: string;
    variant?: "number";
}

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
): void {
    elements.resultRegion.setAttribute("aria-busy", "false");
    elements.resultContent.hidden = false;
    elements.resultContent.classList.remove("is-stale");
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = "再試算する";

    setText(elements.statusMessage, "試算が完了しました。");

    if (result.status === "unavailable") {
        renderUnavailable(elements);
        return;
    }

    renderFallbackMessage(elements, result);
    renderMetrics(elements, input, result);
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
    input: OptimizerInput,
    result: OptimizationResult,
): void {
    const best = result.best;

    if (best === null) {
        elements.resultMetrics.replaceChildren();
        return;
    }

    const metrics = [
        {
            label: "判定",
            value: availabilityLabel(result),
            isPrimary: true,
        },
        { label: "ファンス消費", value: formatNumber(best.fanSpend) },
        { label: "円石消費", value: formatNumber(best.gemSpend) },
        {
            label: "消費後残量",
            variant: "balance",
            details: [
                {
                    label: "ファンス",
                    value: `${formatNumber(input.fanBalance)} → ${formatNumber(best.fanRemain)}`,
                },
                {
                    label: "円石",
                    value: `${formatNumber(input.gemBalance)} → ${formatNumber(best.gemRemain)}`,
                },
            ],
        },
        { label: "残ファンス", value: formatNumber(best.fanRemain) },
        { label: "残円石", value: formatNumber(best.gemRemain) },
    ] satisfies OutcomeMetric[];
    const nodes = metrics.map(
        ({ label, value, isPrimary, variant, details }) => {
            const item = document.createElement("div");
            const term = document.createElement("dt");
            const description = document.createElement("dd");

            item.className = "outcome-summary-item";

            if (isPrimary === true) {
                item.classList.add("is-primary");
            }

            if (variant !== undefined) {
                item.classList.add(`is-${variant}`);
            }

            term.textContent = label;

            if (details !== undefined) {
                description.className = "balance-details";
                details.forEach((detail) => {
                    const row = document.createElement("span");
                    const detailLabel = document.createElement("span");
                    const detailValue = document.createElement("span");

                    row.className = "balance-detail-row";
                    detailLabel.className = "balance-detail-label";
                    detailValue.className = "balance-detail-value";
                    detailLabel.textContent = detail.label;
                    detailValue.textContent = detail.value;
                    row.append(detailLabel, detailValue);
                    description.append(row);
                });
            } else {
                description.textContent = value ?? "";
            }

            item.append(term, description);

            return item;
        },
    );

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
        const cells: ResultCell[] = [
            { label: "順位", value: `${index + 1}`, variant: "number" },
            {
                label: "消費ファンス",
                value: formatNumber(candidate.fanSpend),
                variant: "number",
            },
            {
                label: "消費円石",
                value: formatNumber(candidate.gemSpend),
                variant: "number",
            },
            {
                label: "残ファンス",
                value: formatNumber(candidate.fanRemain),
                variant: "number",
            },
            {
                label: "残円石",
                value: formatNumber(candidate.gemRemain),
                variant: "number",
            },
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
        const cells: ResultCell[] = [
            { label: "回数", value: `${round}回目` },
            {
                label: "支払い方法",
                value: isGemPayment ? "円石払い" : "ファンス払い",
            },
            {
                label: "必要ファンス",
                value: isGemPayment ? "—" : formatNumber(cost?.fans ?? 0),
                variant: "number",
            },
            {
                label: "必要円石",
                value: isGemPayment ? formatNumber(cost?.gems ?? 0) : "—",
                variant: "number",
            },
        ];

        appendLabeledCells(row, cells);

        return row;
    });

    elements.paymentDetailBody.replaceChildren(...rows);
    setText(elements.paymentDetailEmpty, "");
}

function availabilityLabel(result: OptimizationResult): string {
    if (result.status === "available") {
        return `${result.requestedPulls}回まで購入可能`;
    }

    if (result.status === "fallback") {
        return `最大${result.actualPulls}回まで購入可能`;
    }

    return "購入不可";
}

function setText(element: HTMLElement, value: string): void {
    element.textContent = value;
}

function appendLabeledCells(
    row: HTMLTableRowElement,
    cells: ResultCell[],
): void {
    cells.forEach(({ label, value, variant }) => {
        const cell = document.createElement("td");
        cell.dataset.label = label;
        if (variant === "number") {
            cell.classList.add("number-cell");
        }
        cell.textContent = value;
        row.append(cell);
    });
}
