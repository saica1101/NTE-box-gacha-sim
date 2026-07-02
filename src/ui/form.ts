import { defaultCosts, maxPulls } from "../data/defaultCosts";
import type {
    OptimizationMode,
    OptimizerInput,
    RoundCost,
} from "../domain/types";
import {
    isOptimizationMode,
    parseIntegerInput,
    validateCosts,
    validateOptimizerInput,
} from "../domain/validation";
import type { ValidationResult } from "../domain/validation";
import type { PersistedState } from "../storage/persistence";
import { toInputNumber } from "../utils/numbers";
import type { AppElements } from "./elements";

export interface FormErrors {
    fanBalance: string | null;
    gemBalance: string | null;
    gemFanValue: string | null;
    costs: string[];
    summary: string[];
}

export interface FormReadResult {
    input: OptimizerInput | null;
    errors: FormErrors;
}

const emptyErrors = (): FormErrors => ({
    fanBalance: null,
    gemBalance: null,
    gemFanValue: null,
    costs: [],
    summary: [],
});

export function populatePullOptions(elements: AppElements): void {
    elements.targetPullsSelect.replaceChildren();

    for (let count = 1; count <= maxPulls; count += 1) {
        const option = document.createElement("option");
        option.value = String(count);
        option.textContent = `${count}回`;
        elements.targetPullsSelect.append(option);
    }
}

export function populateForm(
    elements: AppElements,
    state: PersistedState,
): void {
    elements.fanBalanceInput.value = toInputNumber(state.fanBalance);
    elements.gemBalanceInput.value = toInputNumber(state.gemBalance);
    elements.targetPullsSelect.value = String(state.targetPulls);
    elements.gemFanValueInput.value = toInputNumber(state.gemFanValue);

    const modeInput = elements.form.querySelector<HTMLInputElement>(
        `input[name="mode"][value="${state.mode}"]`,
    );
    modeInput?.click();

    populateCostRows(elements, state.costs);
    updateGemFanValueAvailability(elements);
}

export function populateCostRows(
    elements: AppElements,
    costs: RoundCost[] = defaultCosts,
): void {
    const rows = costs.map((cost) => {
        const row = document.createElement("fieldset");
        const legend = document.createElement("legend");
        const fanField = document.createElement("label");
        const gemField = document.createElement("label");
        const fanLabel = document.createElement("span");
        const gemLabel = document.createElement("span");
        const fanInput = document.createElement("input");
        const gemInput = document.createElement("input");

        row.className = "cost-row";
        legend.textContent = `${cost.round}回目`;
        fanField.className = "cost-field";
        gemField.className = "cost-field";
        fanLabel.textContent = "必要ファンス";
        gemLabel.textContent = "必要円石";

        fanInput.type = "text";
        fanInput.inputMode = "numeric";
        fanInput.autocomplete = "off";
        fanInput.value = toInputNumber(cost.fans);
        fanInput.dataset.costFans = String(cost.round);
        fanInput.dataset.costInput = "true";
        fanInput.setAttribute("aria-label", `${cost.round}回目の必要ファンス`);

        gemInput.type = "text";
        gemInput.inputMode = "numeric";
        gemInput.autocomplete = "off";
        gemInput.value = toInputNumber(cost.gems);
        gemInput.dataset.costGems = String(cost.round);
        gemInput.dataset.costInput = "true";
        gemInput.setAttribute("aria-label", `${cost.round}回目の必要円石`);

        fanField.append(fanLabel, fanInput);
        gemField.append(gemLabel, gemInput);
        row.append(legend, fanField, gemField);
        return row;
    });

    elements.costList.replaceChildren(...rows);
}

export function readOptimizerInput(elements: AppElements): FormReadResult {
    const errors = emptyErrors();
    const fanBalance = parseIntegerInput(
        elements.fanBalanceInput.value,
        "所持ファンス",
    );
    const gemBalance = parseIntegerInput(
        elements.gemBalanceInput.value,
        "所持円石",
    );
    const gemFanValue = parseIntegerInput(
        elements.gemFanValueInput.value,
        "円石換算値",
    );
    const targetPulls = Number(elements.targetPullsSelect.value);
    const mode = readSelectedMode(elements);
    const costs = readCosts(elements);

    if (!fanBalance.ok) {
        errors.fanBalance = fanBalance.error;
        errors.summary.push(fanBalance.error);
    }

    if (!gemBalance.ok) {
        errors.gemBalance = gemBalance.error;
        errors.summary.push(gemBalance.error);
    }

    if (!gemFanValue.ok) {
        errors.gemFanValue = gemFanValue.error;
        errors.summary.push(gemFanValue.error);
    }

    if (!costs.ok) {
        errors.costs = costs.errors;
        errors.summary.push(...costs.errors);
    }

    if (!isOptimizationMode(mode)) {
        errors.summary.push("最適化モードを選択してください。");
    }

    if (!Number.isSafeInteger(targetPulls)) {
        errors.summary.push("引きたい回数を選択してください。");
    }

    if (
        !fanBalance.ok ||
        !gemBalance.ok ||
        !gemFanValue.ok ||
        !costs.ok ||
        !isOptimizationMode(mode) ||
        !Number.isSafeInteger(targetPulls)
    ) {
        return {
            input: null,
            errors,
        };
    }

    const input: OptimizerInput = {
        fanBalance: fanBalance.value,
        gemBalance: gemBalance.value,
        targetPulls,
        mode,
        gemFanValue: gemFanValue.value,
        costs: costs.value,
    };
    const validation = validateOptimizerInput(input);

    if (!validation.ok) {
        errors.summary.push(...validation.errors);
        return {
            input: null,
            errors,
        };
    }

    return {
        input,
        errors,
    };
}

export function readInputForController(
    elements: AppElements,
): ValidationResult<OptimizerInput> {
    const result = readOptimizerInput(elements);

    if (result.input === null) {
        return {
            ok: false,
            errors: result.errors.summary,
        };
    }

    return {
        ok: true,
        value: result.input,
    };
}

export function toPersistedState(input: OptimizerInput): PersistedState {
    return {
        version: 1,
        fanBalance: input.fanBalance,
        gemBalance: input.gemBalance,
        targetPulls: input.targetPulls,
        mode: input.mode,
        gemFanValue: input.gemFanValue,
        costs: input.costs,
    };
}

export function updateGemFanValueAvailability(elements: AppElements): void {
    const mode = readSelectedMode(elements);
    const isEnabled = mode === "converted-cost";
    elements.gemFanValueInput.disabled = !isEnabled;
    elements.gemFanValueField.classList.toggle("is-disabled", !isEnabled);
}

function readSelectedMode(elements: AppElements): OptimizationMode | null {
    const selected = elements.form.querySelector<HTMLInputElement>(
        'input[name="mode"]:checked',
    );

    if (selected === null || !isOptimizationMode(selected.value)) {
        return null;
    }

    return selected.value;
}

function readCosts(elements: AppElements): ValidationResult<RoundCost[]> {
    const fanInputs = Array.from(
        elements.costList.querySelectorAll<HTMLInputElement>(
            "input[data-cost-fans]",
        ),
    );
    const gemInputs = Array.from(
        elements.costList.querySelectorAll<HTMLInputElement>(
            "input[data-cost-gems]",
        ),
    );
    const costs: RoundCost[] = [];
    const errors: string[] = [];

    for (let index = 0; index < maxPulls; index += 1) {
        const round = index + 1;
        const fanInput = fanInputs.at(index);
        const gemInput = gemInputs.at(index);

        if (fanInput === undefined || gemInput === undefined) {
            errors.push(`${round}回目のコスト入力欄が見つかりません。`);
            continue;
        }

        const fans = parseIntegerInput(
            fanInput.value,
            `${round}回目の必要ファンス`,
        );
        const gems = parseIntegerInput(
            gemInput.value,
            `${round}回目の必要円石`,
        );

        if (!fans.ok) {
            errors.push(fans.error);
        }

        if (!gems.ok) {
            errors.push(gems.error);
        }

        if (fans.ok && gems.ok) {
            costs.push({
                round,
                fans: fans.value,
                gems: gems.value,
            });
        }
    }

    if (errors.length > 0) {
        return {
            ok: false,
            errors,
        };
    }

    return validateCosts(costs);
}
