import "./style.css";
import {
    boxGachas,
    defaultBoxGachaId,
    getBoxGachaById,
} from "./data/boxGachas";
import { optimize } from "./domain/optimizer";
import { getAppElements } from "./ui/elements";
import {
    populateBoxGachaOptions,
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

populateBoxGachaOptions(elements, boxGachas);
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

elements.backToTopButton.addEventListener("click", () => {
    scrollToInput();
});

elements.resetCostsButton.addEventListener("click", () => {
    applySelectedBoxGachaCosts();
    handleInputChange(
        null,
        "対象ガチャの初期コストへ戻しました。試算ボタンを押してください。",
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
    const isBoxGachaChange = event?.target === elements.boxGachaSelect;

    if (isBoxGachaChange) {
        applySelectedBoxGachaCosts();
    }

    if (
        event?.target instanceof HTMLInputElement &&
        event.target.name === "mode"
    ) {
        updateGemFanValueAvailability(elements);
    }

    const read = readOptimizerInput(elements);
    renderFormErrors(elements, read.errors);

    if (read.input !== null) {
        savePersistedState(
            window.localStorage,
            toPersistedState(read.input, getSelectedBoxGachaId()),
        );
    }

    const isCostInput =
        event?.target instanceof HTMLElement &&
        event.target.dataset.costInput === "true";
    const message =
        forcedMessage ??
        (isBoxGachaChange
            ? "対象ガチャを変更しました。試算ボタンを押してください。"
            : isCostInput
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
        scrollToOutput();
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
        savePersistedState(
            window.localStorage,
            toPersistedState(read.input, getSelectedBoxGachaId()),
        );
        renderResult(elements, read.input, result, totalElapsedMs);
        scrollToOutput();
    } catch (error) {
        console.error("試算処理で予期しないエラーが発生しました。", error);
        renderError(
            elements,
            "予期しないエラーが発生しました。入力内容を確認して再度お試しください。",
        );
        scrollToOutput();
    } finally {
        isCalculating = false;
    }
}

function scrollToOutput(): void {
    elements.resultRegion.scrollIntoView({
        behavior: "smooth",
        block: "start",
    });
    elements.resultHeading.focus({ preventScroll: true });
}

function scrollToInput(): void {
    elements.inputSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
    });
}

function applySelectedBoxGachaCosts(): void {
    const selected = getBoxGachaById(getSelectedBoxGachaId());

    if (selected !== undefined) {
        populateCostRows(elements, selected.costs);
    }
}

function getSelectedBoxGachaId(): string {
    const selected = getBoxGachaById(elements.boxGachaSelect.value);

    if (selected !== undefined) {
        return selected.id;
    }

    elements.boxGachaSelect.value = defaultBoxGachaId;
    return defaultBoxGachaId;
}
