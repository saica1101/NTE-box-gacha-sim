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
    variant: "primary" | "cost" | "balance";
    count?: number;
    unit?: string;
    subtext?: string;
    rows?: OutcomeMetricRow[];
}

interface OutcomeMetricRow {
    label: string;
    value: string;
    isZero: boolean;
}

interface ResultCell {
    label: string;
    value: string;
    variant?: "number";
}

type StatusTone = "idle" | "stale" | "loading" | "success" | "error";

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

    setStatus(elements, visibleMessage, options.isStale ? "stale" : "idle");
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
    setStatus(elements, "計算中…", "loading");
}

export function renderError(elements: AppElements, message: string): void {
    elements.resultRegion.setAttribute("aria-busy", "false");
    elements.resultContent.hidden = true;
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = "試算する";
    setStatus(elements, message, "error");
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

    setStatus(elements, "試算が完了しました。", "success");

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
        {
            label: "判定結果",
            variant: "primary",
            count: result.actualPulls,
            unit: "回",
            subtext: availabilitySubtext(result),
        },
        {
            label: "消費コスト",
            variant: "cost",
            rows: [
                {
                    label: "ファンス消費",
                    value: formatNumber(best.fanSpend),
                    isZero: best.fanSpend === 0,
                },
                {
                    label: "円石消費",
                    value: formatNumber(best.gemSpend),
                    isZero: best.gemSpend === 0,
                },
            ],
        },
        {
            label: "残高情報",
            variant: "balance",
            rows: [
                {
                    label: "残ファンス",
                    value: formatNumber(best.fanRemain),
                    isZero: best.fanRemain === 0,
                },
                {
                    label: "残円石",
                    value: formatNumber(best.gemRemain),
                    isZero: best.gemRemain === 0,
                },
            ],
        },
    ] satisfies OutcomeMetric[];
    const nodes = metrics.map((metric) => createOutcomeMetricNode(metric));

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

function createOutcomeMetricNode(metric: OutcomeMetric): HTMLDivElement {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    item.className = `outcome-summary-item is-${metric.variant}`;
    term.className = "metric-card-title";
    description.className = "metric-card-body";
    term.textContent = metric.label;

    if (metric.variant === "primary") {
        const highlight = document.createElement("div");
        const number = document.createElement("span");
        const unit = document.createElement("span");
        const subtext = document.createElement("span");

        highlight.className = "result-highlight";
        number.className = "result-number";
        unit.className = "result-unit";
        subtext.className = "result-subtext";
        number.textContent = String(metric.count ?? 0);
        unit.textContent = metric.unit ?? "";
        subtext.textContent = metric.subtext ?? "";
        number.append(unit);
        highlight.append(number);
        description.append(highlight, subtext);
    } else {
        const rows = document.createElement("div");

        rows.className = "metric-rows";
        metric.rows?.forEach((metricRow) => {
            const row = document.createElement("span");
            const label = document.createElement("span");
            const value = document.createElement("span");

            row.className = "metric-row";
            label.className = "metric-label";
            value.className = "metric-value";

            if (metricRow.isZero) {
                value.classList.add("is-zero");
            }

            label.textContent = metricRow.label;
            value.textContent = metricRow.value;
            row.append(label, value);
            rows.append(row);
        });
        description.append(rows);
    }

    item.append(term, description);

    return item;
}

function availabilitySubtext(result: OptimizationResult): string {
    if (result.status === "available") {
        return "まで購入可能";
    }

    if (result.status === "fallback") {
        return "まで購入可能";
    }

    return "購入不可";
}

function setStatus(
    elements: AppElements,
    message: string,
    tone: StatusTone,
): void {
    const statusAlert = elements.statusMessage.closest(".status-alert");

    statusAlert?.classList.remove(
        "is-idle",
        "is-stale",
        "is-loading",
        "is-success",
        "is-error",
    );
    statusAlert?.classList.add(`is-${tone}`);
    setText(elements.statusMessage, message);
    setText(elements.fallbackMessage, "");
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
