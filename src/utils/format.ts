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

    const rounds = Array.from({ length: actualPulls }, (_, index) => index + 1)
        .filter((round) => {
            const isGemPayment = (candidate.mask & (1 << (round - 1))) !== 0;
            return payment === "gems" ? isGemPayment : !isGemPayment;
        })
        .map((round) => `${round}回目`);

    if (rounds.length === 0) {
        return "なし";
    }

    return rounds.join("・");
}

export function formatCandidateSummary(candidate: Candidate): string {
    return [
        `ファンス ${formatNumber(candidate.fanSpend)}`,
        `円石 ${formatNumber(candidate.gemSpend)}`,
        `消費率 ${formatPercent(Math.max(candidate.fanRate, candidate.gemRate))}`,
    ].join(" / ");
}
