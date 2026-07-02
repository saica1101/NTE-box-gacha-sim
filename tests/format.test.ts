import { describe, expect, test } from "vitest";
import type { Candidate } from "../src/domain/types";
import { formatRounds } from "../src/utils/format";

function candidate(mask: number): Candidate {
    return {
        mask,
        fanSpend: 0,
        gemSpend: 0,
        fanRemain: 0,
        gemRemain: 0,
        fanRate: 0,
        gemRate: 0,
    };
}

describe("formatRounds", () => {
    test("連続した支払い回を範囲へまとめて読みやすく表示する", () => {
        const mask = (1 << 9) | (1 << 10) | (1 << 13) | (1 << 14);

        expect(formatRounds(candidate(mask), "gems", 15)).toBe(
            "10〜11回目、14〜15回目",
        );
    });

    test("単独回と連続回を混在させて表示する", () => {
        const mask = (1 << 0) | (1 << 10) | (1 << 11) | (1 << 12) | (1 << 13);

        expect(formatRounds(candidate(mask), "gems", 15)).toBe(
            "1回目、11〜14回目",
        );
    });
});
