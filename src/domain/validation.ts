import { maxPulls } from "../data/defaultCosts";
import type { OptimizationMode, OptimizerInput, RoundCost } from "./types";
import { optimizationModes } from "./types";

export type ParseIntegerResult =
    | {
          ok: true;
          value: number;
      }
    | {
          ok: false;
          error: string;
      };

export type ValidationResult<T> =
    | {
          ok: true;
          value: T;
      }
    | {
          ok: false;
          errors: string[];
      };

const fullWidthDigitOffset = "０".charCodeAt(0) - "0".charCodeAt(0);

export function parseIntegerInput(
    source: string,
    label: string,
): ParseIntegerResult {
    const normalized = source
        .trim()
        .replace(/[０-９]/g, (digit) =>
            String.fromCharCode(digit.charCodeAt(0) - fullWidthDigitOffset),
        )
        .replace(/，/g, ",");

    if (normalized.length === 0) {
        return {
            ok: false,
            error: `${label}を入力してください。`,
        };
    }

    if (normalized.startsWith("-") || normalized.startsWith("－")) {
        return {
            ok: false,
            error: `${label}は0以上の整数で入力してください。`,
        };
    }

    if (/[.．]/.test(normalized)) {
        return {
            ok: false,
            error: `${label}に小数は使用できません。`,
        };
    }

    if (!/^[0-9,]+$/.test(normalized)) {
        return {
            ok: false,
            error: `${label}は数値で入力してください。`,
        };
    }

    const withoutCommas = normalized.replaceAll(",", "");

    if (withoutCommas.length === 0) {
        return {
            ok: false,
            error: `${label}は数値で入力してください。`,
        };
    }

    const value = Number(withoutCommas);

    if (!Number.isSafeInteger(value) || value < 0) {
        return {
            ok: false,
            error: `${label}は0以上の整数で入力してください。`,
        };
    }

    return {
        ok: true,
        value,
    };
}

export function isOptimizationMode(value: unknown): value is OptimizationMode {
    return (
        typeof value === "string" &&
        optimizationModes.includes(value as OptimizationMode)
    );
}

export function validateCosts(
    costs: RoundCost[],
): ValidationResult<RoundCost[]> {
    const errors: string[] = [];

    if (costs.length !== maxPulls) {
        errors.push(`コスト表は${maxPulls}回分必要です。`);
    }

    costs.forEach((cost, index) => {
        const round = index + 1;

        if (cost.round !== round) {
            errors.push(`${round}回目の回数が不正です。`);
        }

        if (!Number.isSafeInteger(cost.fans) || cost.fans < 0) {
            errors.push(
                `${round}回目の必要ファンスは0以上の整数にしてください。`,
            );
        }

        if (!Number.isSafeInteger(cost.gems) || cost.gems < 0) {
            errors.push(`${round}回目の必要円石は0以上の整数にしてください。`);
        }
    });

    if (errors.length > 0) {
        return {
            ok: false,
            errors,
        };
    }

    return {
        ok: true,
        value: costs,
    };
}

export function validateOptimizerInput(
    input: OptimizerInput,
): ValidationResult<OptimizerInput> {
    const errors: string[] = [];

    if (!Number.isSafeInteger(input.fanBalance) || input.fanBalance < 0) {
        errors.push("所持ファンスは0以上の整数で入力してください。");
    }

    if (!Number.isSafeInteger(input.gemBalance) || input.gemBalance < 0) {
        errors.push("所持円石は0以上の整数で入力してください。");
    }

    if (
        !Number.isSafeInteger(input.targetPulls) ||
        input.targetPulls < 1 ||
        input.targetPulls > maxPulls
    ) {
        errors.push(`引きたい回数は1〜${maxPulls}で選択してください。`);
    }

    if (!isOptimizationMode(input.mode)) {
        errors.push("最適化モードが不正です。");
    }

    if (!Number.isSafeInteger(input.gemFanValue) || input.gemFanValue < 0) {
        errors.push("円石換算値は0以上の整数で入力してください。");
    }

    const costValidation = validateCosts(input.costs);

    if (!costValidation.ok) {
        errors.push(...costValidation.errors);
    }

    if (errors.length > 0) {
        return {
            ok: false,
            errors,
        };
    }

    return {
        ok: true,
        value: input,
    };
}
