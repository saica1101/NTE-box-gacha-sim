import source from "../../box_gachas.json";
import type { RoundCost } from "../domain/types";

const expectedCostCount = 15;

interface RawBoxGachaCost {
    count: number;
    fans: number;
    gems: number;
}

interface RawBoxGacha {
    id: string;
    name: string;
    costs: RawBoxGachaCost[];
}

interface RawBoxGachaCatalog {
    version: number;
    box_gachas: RawBoxGacha[];
}

export interface BoxGacha {
    id: string;
    name: string;
    costs: RoundCost[];
}

export const boxGachas = normalizeBoxGachas(source);
export const defaultBoxGachaId =
    getBoxGachaById("draco")?.id ?? boxGachas[0].id;
export const defaultBoxGacha =
    getBoxGachaById(defaultBoxGachaId) ?? boxGachas[0];

export function getBoxGachaById(id: string): BoxGacha | undefined {
    return boxGachas.find((gacha) => gacha.id === id);
}

function normalizeBoxGachas(catalog: RawBoxGachaCatalog): BoxGacha[] {
    if (catalog.version !== 1 || catalog.box_gachas.length === 0) {
        throw new Error("box_gachas.json の形式が不正です。");
    }

    return catalog.box_gachas.map((gacha) => ({
        id: gacha.id,
        name: gacha.name,
        costs: normalizeCosts(gacha.id, gacha.costs),
    }));
}

function normalizeCosts(
    gachaId: string,
    costs: RawBoxGachaCost[],
): RoundCost[] {
    if (costs.length !== expectedCostCount) {
        throw new Error(`${gachaId} のコスト定義は15件必要です。`);
    }

    return [...costs]
        .sort((left, right) => left.count - right.count)
        .map((cost, index) => {
            const round = index + 1;

            if (
                cost.count !== round ||
                !Number.isSafeInteger(cost.fans) ||
                cost.fans < 0 ||
                !Number.isSafeInteger(cost.gems) ||
                cost.gems < 0
            ) {
                throw new Error(`${gachaId} の${round}回目コストが不正です。`);
            }

            return {
                round,
                fans: cost.fans,
                gems: cost.gems,
            };
        });
}
