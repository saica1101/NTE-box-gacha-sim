export interface AppElements {
    form: HTMLFormElement;
    fanBalanceInput: HTMLInputElement;
    fanBalanceError: HTMLElement;
    gemBalanceInput: HTMLInputElement;
    gemBalanceError: HTMLElement;
    targetPullsSelect: HTMLSelectElement;
    gemFanValueInput: HTMLInputElement;
    gemFanValueError: HTMLElement;
    gemFanValueField: HTMLElement;
    formErrorSummary: HTMLElement;
    costList: HTMLElement;
    costError: HTMLElement;
    costSettingsDialog: HTMLDialogElement;
    openCostsButton: HTMLButtonElement;
    closeCostsButton: HTMLButtonElement;
    resetCostsButton: HTMLButtonElement;
    submitButton: HTMLButtonElement;
    resultRegion: HTMLElement;
    resultHeading: HTMLElement;
    statusMessage: HTMLElement;
    resultContent: HTMLElement;
    fallbackMessage: HTMLElement;
    resultMetrics: HTMLElement;
    gemRounds: HTMLElement;
    fanRounds: HTMLElement;
    topCandidatesBody: HTMLTableSectionElement;
    topCandidatesEmpty: HTMLElement;
    paymentDetailBody: HTMLTableSectionElement;
    paymentDetailEmpty: HTMLElement;
}

export function getAppElements(): AppElements {
    return {
        form: getElement("sim-form", HTMLFormElement),
        fanBalanceInput: getElement("fan-balance", HTMLInputElement),
        fanBalanceError: getElement("fan-balance-error", HTMLElement),
        gemBalanceInput: getElement("gem-balance", HTMLInputElement),
        gemBalanceError: getElement("gem-balance-error", HTMLElement),
        targetPullsSelect: getElement("target-pulls", HTMLSelectElement),
        gemFanValueInput: getElement("gem-fan-value", HTMLInputElement),
        gemFanValueError: getElement("gem-fan-value-error", HTMLElement),
        gemFanValueField: getElement("gem-fan-value-field", HTMLElement),
        formErrorSummary: getElement("form-error-summary", HTMLElement),
        costList: getElement("cost-list", HTMLElement),
        costError: getElement("cost-error", HTMLElement),
        costSettingsDialog: getElement(
            "cost-settings-dialog",
            HTMLDialogElement,
        ),
        openCostsButton: getElement("open-costs-button", HTMLButtonElement),
        closeCostsButton: getElement("close-costs-button", HTMLButtonElement),
        resetCostsButton: getElement("reset-costs-button", HTMLButtonElement),
        submitButton: getElement("submit-button", HTMLButtonElement),
        resultRegion: getElement("result-region", HTMLElement),
        resultHeading: getElement("result-heading", HTMLElement),
        statusMessage: getElement("status-message", HTMLElement),
        resultContent: getElement("result-content", HTMLElement),
        fallbackMessage: getElement("fallback-message", HTMLElement),
        resultMetrics: getElement("result-metrics", HTMLElement),
        gemRounds: getElement("gem-rounds", HTMLElement),
        fanRounds: getElement("fan-rounds", HTMLElement),
        topCandidatesBody: getElement(
            "top-candidates-body",
            HTMLTableSectionElement,
        ),
        topCandidatesEmpty: getElement("top-candidates-empty", HTMLElement),
        paymentDetailBody: getElement(
            "payment-detail-body",
            HTMLTableSectionElement,
        ),
        paymentDetailEmpty: getElement("payment-detail-empty", HTMLElement),
    };
}

function getElement<T extends HTMLElement>(
    id: string,
    elementType: new () => T,
): T {
    const element = document.getElementById(id);

    if (!(element instanceof elementType)) {
        throw new Error(
            `#${id} が見つからないか、想定した要素ではありません。`,
        );
    }

    return element;
}
