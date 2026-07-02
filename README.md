# NTE Draco Box 支払い試算

Neverness To Everness の全15回ガチャについて、所持している
「ファンス」と「円石」から、各回をどちらで支払うのがよいかを
ブラウザ内で試算する1ページアプリです。

## 主な機能

- 15回分のファンス払い・円石払いを総当たりで評価
- バランス、円石温存、ファンス温存、総合コスト（換算）の4モード
- 指定回数を買えない場合は、購入可能な最大回数へ自動で切り下げ
- 最適候補と上位5件、各回の支払い詳細を表示
- 15回分のコスト表を編集して localStorage に保存
- URLSearchParams による条件共有
- 入力変更だけでは自動計算せず、「試算する」押下時のみ計算
- すべての計算はブラウザ内で完結し、外部APIを使用しません

## 技術構成

- TypeScript
- Vite
- HTML / CSS / TypeScript
- Vitest
- ESLint
- Prettier
- GitHub Actions
- GitHub Pages

UIフレームワーク、バックエンド、データベース、外部CDNは使用していません。

## 計算基準

各回はビットマスクで表現します。

- ビット0: 1回目
- ビット14: 15回目
- 0: ファンス払い
- 1: 円石払い

最大15回なので、最大 `2^15 = 32,768` 通りを生成します。所持量を超える
候補は除外し、選択した最適化モードの比較順で完全ソートします。同じ
ファンス消費・円石消費の候補は、支払いマスクが小さい候補を残します。

## 最適化モード

- バランス: ファンス消費率と円石消費率の最大値を最小化
- 円石温存: 円石消費、ファンス消費、最大消費率の順で比較
- ファンス温存: ファンス消費、円石消費、最大消費率の順で比較
- 総合コスト（換算）: `ファンス消費 + 円石消費 * 円石換算値` を最小化

上位5候補は、選択中のモードと同じ評価基準で順位付けしたものです。

## 計算時間

画面にはフォーム送信から結果描画までの総時間と、`optimize` 内部の
最適化処理時間を表示します。計測には `performance.now()` を使用します。
最大条件でも10秒以内に結果を表示することを性能目標にしています。

## ローカル開発

```bash
npm install
npm run dev
```

## 検証

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run benchmark
npm run build
```

まとめて確認する場合:

```bash
npm run check
```

性能確認だけを実行する場合:

```bash
npm run benchmark
```

ビルド後の表示確認:

```bash
npm run preview
```

## GitHub Pages 公開

1. GitHub リポジトリへ push します。
2. Settings → Pages を開きます。
3. Source を「GitHub Actions」に設定します。
4. `main` ブランチへ push すると `.github/workflows/deploy-pages.yml` が実行されます。
5. `dist` が Pages artifact としてアップロードされ、GitHub Pages へデプロイされます。

通常のプロジェクトPagesでは、公開URLは次の形になります。

```text
https://<owner>.github.io/NTE_Draco_Box_sim/
```

`<owner>.github.io` 形式のユーザーPagesでは、base path は `/` になります。
Vite の `base` は GitHub Actions 上の `GITHUB_REPOSITORY` から自動判定します。

## デプロイ失敗時の確認事項

- Settings → Pages の Source が「GitHub Actions」になっているか
- `npm ci` が通る `package-lock.json` がコミットされているか
- `npm run check` と `npm run build` がローカルで成功するか
- Pages workflow に `pages: write` と `id-token: write` があるか
- `dist` が Pages artifact としてアップロードされているか

## コスト変更とリセット

「詳細設定：回ごとの必要コスト」を開くと、15回分のファンス・円石コストを
編集できます。変更後は自動試算せず、結果欄へ条件変更済みであることを
表示します。初期値へ戻す場合は「初期値へ戻す」を押してください。

localStorage を完全に削除したい場合は、ブラウザの開発者ツールから
`nte-draco-box-sim` の保存値を削除するか、サイトデータを消去してください。

## URL共有

「条件を共有」を押すと、所持ファンス、所持円石、引きたい回数、
最適化モード、円石換算値を含むURLをクリップボードへコピーします。
コスト表全体はURLに含めません。共有URLを開いた場合も自動試算は行わず、
「試算する」を押したときだけ計算します。
