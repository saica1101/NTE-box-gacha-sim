import type { Candidate } from "../domain/types";
import { formatNumber, formatPercent } from "./numbers";

export function formatRounds(
    candidate: Candidate | null,
    payment: "fans" | "gems",
    actualPulls: number,
): string {
    if (candidate === null || actualPulls === 0) {
        return "なし";
    }

    const rounds = Array.from(
        { length: actualPulls },
        (_, index) => index + 1,
    ).filter((round) => {
        const isGemPayment = (candidate.mask & (1 << (round - 1))) !== 0;
        return payment === "gems" ? isGemPayment : !isGemPayment;
    });

    if (rounds.length === 0) {
        return "なし";
    }

    return formatRoundGroups(rounds);
}

export function formatCandidateSummary(candidate: Candidate): string {
    return [
        `ファンス ${formatNumber(candidate.fanSpend)}`,
        `円石 ${formatNumber(candidate.gemSpend)}`,
        `消費率 ${formatPercent(Math.max(candidate.fanRate, candidate.gemRate))}`,
    ].join(" / ");
}

function formatRoundGroups(rounds: number[]): string {
    const groups: string[] = [];
    let start = rounds[0] ?? 0;
    let previous = start;

    for (let index = 1; index <= rounds.length; index += 1) {
        const current = rounds[index];

        if (current === previous + 1) {
            previous = current;
            continue;
        }

        groups.push(formatRoundGroup(start, previous));

        if (current !== undefined) {
            start = current;
            previous = current;
        }
    }

    return groups.join("、");
}

function formatRoundGroup(start: number, end: number): string {
    if (start === end) {
        return `${start}回目`;
    }

    return `${start}〜${end}回目`;
}
