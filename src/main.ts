import "./style.css";
import { defaultCosts } from "./data/defaultCosts";
import { optimize } from "./domain/optimizer";
import { getAppElements } from "./ui/elements";
import {
    populateCostRows,
    populateForm,
    populatePullOptions,
    readOptimizerInput,
    toPersistedState,
    updateGemFanValueAvailability,
} from "./ui/form";
import { loadPersistedState, savePersistedState } from "./storage/persistence";
import {
    renderCalculating,
    renderError,
    renderFormErrors,
    renderNotice,
    renderResult,
} from "./ui/render";
import { nextAnimationFrame } from "./utils/performance";
import { parseSharedInput } from "./utils/shareUrl";

const elements = getAppElements();
let persistedState = loadPersistedState(window.localStorage);
let hasCalculated = false;
let isCalculating = false;

populatePullOptions(elements);

const sharedInput = parseSharedInput(new URL(window.location.href));

if (sharedInput.ok) {
    persistedState = {
        ...persistedState,
        ...sharedInput.value,
    };
}

populateForm(elements, persistedState);
renderNotice(
    elements,
    sharedInput.ok
        ? "共有された条件を読み込みました。「試算する」を押してください。"
        : "条件を確認して「試算する」を押してください。",
);

elements.form.addEventListener("input", (event) => {
    handleInputChange(event);
});

elements.form.addEventListener("change", (event) => {
    handleInputChange(event);
});

elements.form.addEventListener("submit", (event) => {
    void handleSubmit(event);
});

elements.resetCostsButton.addEventListener("click", () => {
    populateCostRows(elements, defaultCosts);
    handleInputChange(
        null,
        "コスト設定が変更されています。試算ボタンを押してください。",
    );
});

elements.openCostsButton.addEventListener("click", () => {
    if (typeof elements.costSettingsDialog.showModal === "function") {
        elements.costSettingsDialog.showModal();
        return;
    }

    elements.costSettingsDialog.setAttribute("open", "");
});

elements.closeCostsButton.addEventListener("click", () => {
    closeCostSettings();
});

elements.costSettingsDialog.addEventListener("click", (event) => {
    if (event.target === elements.costSettingsDialog) {
        closeCostSettings();
    }
});

function closeCostSettings(): void {
    if (typeof elements.costSettingsDialog.close === "function") {
        elements.costSettingsDialog.close();
        return;
    }

    elements.costSettingsDialog.removeAttribute("open");
}

function handleInputChange(event: Event | null, forcedMessage?: string): void {
    if (
        event?.target instanceof HTMLInputElement &&
        event.target.name === "mode"
    ) {
        updateGemFanValueAvailability(elements);
    }

    const read = readOptimizerInput(elements);
    renderFormErrors(elements, read.errors);

    if (read.input !== null) {
        savePersistedState(window.localStorage, toPersistedState(read.input));
    }

    const isCostInput =
        event?.target instanceof HTMLElement &&
        event.target.dataset.costInput === "true";
    const message =
        forcedMessage ??
        (isCostInput
            ? "コスト設定が変更されています。試算ボタンを押してください。"
            : "条件が変更されています。試算ボタンを押してください。");

    renderNotice(elements, message, { isStale: hasCalculated });
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (isCalculating) {
        return;
    }

    const read = readOptimizerInput(elements);
    renderFormErrors(elements, read.errors);

    if (read.input === null) {
        renderError(elements, "入力内容を確認してください。");
        return;
    }

    isCalculating = true;
    renderCalculating(elements);
    const totalStartedAt = performance.now();

    try {
        await nextAnimationFrame();
        const result = optimize(read.input);
        const totalElapsedMs = performance.now() - totalStartedAt;
        hasCalculated = true;
        savePersistedState(window.localStorage, toPersistedState(read.input));
        renderResult(elements, read.input, result, totalElapsedMs);
    } catch (error) {
        console.error("試算処理で予期しないエラーが発生しました。", error);
        renderError(
            elements,
            "予期しないエラーが発生しました。入力内容を確認して再度お試しください。",
        );
    } finally {
        isCalculating = false;
    }
}
