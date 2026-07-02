import { describe, expect, test } from "vitest";
import {
    boxGachas,
    defaultBoxGachaId,
    getBoxGachaById,
} from "../src/data/boxGachas";

describe("boxGachas", () => {
    test("JSONに定義したボックスガチャを選択肢として読み込む", () => {
        expect(boxGachas.map((gacha) => gacha.id)).toEqual([
            "porsche",
            "draco",
        ]);
        expect(boxGachas.map((gacha) => gacha.name)).toEqual([
            "ポルシェ ボックスガチャ",
            "ドラコ ボックスガチャ",
        ]);
    });

    test("countを既存計算用のroundへ変換し、選択したガチャのコストを取得する", () => {
        const porsche = getBoxGachaById("porsche");

        expect(porsche?.costs.at(0)).toEqual({
            round: 1,
            fans: 50_000,
            gems: 50,
        });
        expect(porsche?.costs.at(14)).toEqual({
            round: 15,
            fans: 4_200_000,
            gems: 2_200,
        });
    });

    test("既定の対象ガチャはドラコにする", () => {
        expect(defaultBoxGachaId).toBe("draco");
        expect(getBoxGachaById(defaultBoxGachaId)?.costs.at(14)).toEqual({
            round: 15,
            fans: 2_200_000,
            gems: 1_000,
        });
    });
});
