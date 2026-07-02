import type {
    AppState,
    OptimizationResult,
    OptimizerInput,
} from "../domain/types";
import type { ValidationResult } from "../domain/validation";

interface CalculatorControllerDependencies {
    readInput: () => ValidationResult<OptimizerInput>;
    optimize: (
        input: OptimizerInput,
    ) => OptimizationResult | Promise<OptimizationResult>;
}

export interface CalculatorController {
    getState: () => AppState;
    markInputChanged: (message: string) => void;
    submit: () => Promise<void>;
}

export function createInitialAppState(): AppState {
    return {
        phase: "idle",
        lastInput: null,
        result: null,
        errorMessage: null,
        noticeMessage: "条件を確認して「試算する」を押してください。",
    };
}

export function createCalculatorController(
    dependencies: CalculatorControllerDependencies,
): CalculatorController {
    let state = createInitialAppState();

    return {
        getState: () => state,
        markInputChanged: (message: string) => {
            state = {
                ...state,
                phase: "dirty",
                errorMessage: null,
                noticeMessage: message,
            };
        },
        submit: async () => {
            state = {
                ...state,
                phase: "validating",
                errorMessage: null,
                noticeMessage: null,
            };

            const input = dependencies.readInput();

            if (!input.ok) {
                state = {
                    ...state,
                    phase: "error",
                    errorMessage: input.errors.join("\n"),
                };
                return;
            }

            state = {
                ...state,
                phase: "calculating",
                lastInput: input.value,
            };

            const result = await dependencies.optimize(input.value);

            state = {
                ...state,
                phase: "success",
                result,
                errorMessage: null,
                noticeMessage: null,
            };
        },
    };
}
