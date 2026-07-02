import type { OptimizationMode, OptimizerInput } from "../domain/types";
import { isOptimizationMode, parseIntegerInput } from "../domain/validation";

export interface SharedInput {
    fanBalance: number;
    gemBalance: number;
    targetPulls: number;
    mode: OptimizationMode;
    gemFanValue: number;
}

export type SharedInputResult =
    | {
          ok: true;
          value: SharedInput;
      }
    | {
          ok: false;
      };

export function createShareUrl(source: URL, input: OptimizerInput): string {
    const url = new URL(source.href);
    url.searchParams.set("fans", String(input.fanBalance));
    url.searchParams.set("gems", String(input.gemBalance));
    url.searchParams.set("pulls", String(input.targetPulls));
    url.searchParams.set("mode", input.mode);
    url.searchParams.set("gemFanValue", String(input.gemFanValue));
    return url.toString();
}

export function parseSharedInput(url: URL): SharedInputResult {
    const fanBalance = parseParam(url.searchParams, "fans", "所持ファンス");
    const gemBalance = parseParam(url.searchParams, "gems", "所持円石");
    const targetPulls = parseParam(url.searchParams, "pulls", "引きたい回数");
    const gemFanValue = parseParam(
        url.searchParams,
        "gemFanValue",
        "円石換算値",
    );
    const mode = url.searchParams.get("mode");

    if (
        !fanBalance.ok ||
        !gemBalance.ok ||
        !targetPulls.ok ||
        !gemFanValue.ok ||
        !isOptimizationMode(mode) ||
        targetPulls.value < 1 ||
        targetPulls.value > 15
    ) {
        return {
            ok: false,
        };
    }

    return {
        ok: true,
        value: {
            fanBalance: fanBalance.value,
            gemBalance: gemBalance.value,
            targetPulls: targetPulls.value,
            mode,
            gemFanValue: gemFanValue.value,
        },
    };
}

function parseParam(searchParams: URLSearchParams, key: string, label: string) {
    const source = searchParams.get(key);

    if (source === null) {
        return {
            ok: false,
        } as const;
    }

    return parseIntegerInput(source, label);
}
