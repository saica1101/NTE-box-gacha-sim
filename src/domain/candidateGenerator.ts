import type { Candidate, OptimizerInput } from "./types";

export interface CandidateGenerationResult {
    patternCount: number;
    candidates: Candidate[];
}

export function generateCandidates(
    input: OptimizerInput,
    actualPulls: number,
): CandidateGenerationResult {
    const patternCount = 1 << actualPulls;
    const candidates: Candidate[] = [];

    for (let mask = 0; mask < patternCount; mask += 1) {
        let fanSpend = 0;
        let gemSpend = 0;

        for (let index = 0; index < actualPulls; index += 1) {
            const cost = input.costs[index];

            if (cost === undefined) {
                throw new Error(`${index + 1}回目のコスト設定がありません。`);
            }

            if ((mask & (1 << index)) === 0) {
                fanSpend += cost.fans;
            } else {
                gemSpend += cost.gems;
            }
        }

        if (fanSpend > input.fanBalance || gemSpend > input.gemBalance) {
            continue;
        }

        candidates.push({
            mask,
            fanSpend,
            gemSpend,
            fanRemain: input.fanBalance - fanSpend,
            gemRemain: input.gemBalance - gemSpend,
            fanRate: calculateRate(fanSpend, input.fanBalance),
            gemRate: calculateRate(gemSpend, input.gemBalance),
        });
    }

    return {
        patternCount,
        candidates,
    };
}

function calculateRate(spend: number, balance: number): number {
    if (balance === 0) {
        return 0;
    }

    return spend / balance;
}
