import { describe, expect, test } from "vitest";
import { defaultCosts } from "../src/data/defaultCosts";
import {
    createDefaultPersistedState,
    loadPersistedState,
    savePersistedState,
    storageKey,
} from "../src/storage/persistence";
import type { PersistedState } from "../src/storage/persistence";

class MemoryStorage implements Storage {
    private readonly values = new Map<string, string>();

    get length(): number {
        return this.values.size;
    }

    clear(): void {
        this.values.clear();
    }

    getItem(key: string): string | null {
        return this.values.get(key) ?? null;
    }

    key(index: number): string | null {
        return Array.from(this.values.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.values.delete(key);
    }

    setItem(key: string, value: string): void {
        this.values.set(key, value);
    }
}

describe("persistence", () => {
    test("保存した状態を型検証して復元する", () => {
        const storage = new MemoryStorage();
        const state: PersistedState = {
            version: 1,
            boxGachaId: "porsche",
            fanBalance: 1_000,
            gemBalance: 200,
            targetPulls: 7,
            mode: "save-gems",
            gemFanValue: 3_000,
            costs: defaultCosts,
        };

        savePersistedState(storage, state);

        expect(loadPersistedState(storage)).toEqual(state);
    });

    test("壊れたlocalStorageは安全に初期値へ戻す", () => {
        const storage = new MemoryStorage();
        storage.setItem(storageKey, "{not json");

        expect(loadPersistedState(storage)).toEqual(
            createDefaultPersistedState(),
        );
    });

    test("保存キーを新しいプロジェクト名に合わせる", () => {
        const storage = new MemoryStorage();

        savePersistedState(storage, createDefaultPersistedState());

        expect(storageKey).toBe("nte-box-gacha-sim");
        expect(storage.getItem("nte-box-gacha-sim")).not.toBeNull();
        expect(storage.getItem("nte-draco-box-sim")).toBeNull();
    });

    test("旧プロジェクト名の保存値も移行用に復元する", () => {
        const storage = new MemoryStorage();
        const state: PersistedState = {
            version: 1,
            boxGachaId: "draco",
            fanBalance: 5_000,
            gemBalance: 300,
            targetPulls: 12,
            mode: "balance",
            gemFanValue: 2_000,
            costs: defaultCosts,
        };

        storage.setItem("nte-draco-box-sim", JSON.stringify(state));

        expect(loadPersistedState(storage)).toEqual(state);
    });

    test("旧形式のlocalStorageは既定ガチャIDを補って復元する", () => {
        const storage = new MemoryStorage();
        storage.setItem(
            "nte-draco-box-sim",
            JSON.stringify({
                version: 1,
                fanBalance: 1_000,
                gemBalance: 200,
                targetPulls: 7,
                mode: "save-gems",
                gemFanValue: 3_000,
                costs: defaultCosts,
            }),
        );

        expect(loadPersistedState(storage).boxGachaId).toBe("draco");
    });
});
