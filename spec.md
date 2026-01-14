# DNCL Sandbox Studio - Technical Specifications

## 1. プロジェクト概要
共通テスト「情報I」用のプログラミング言語「DNCL」を学習するための、ProgateスタイルのWebアプリケーション。
教育者が教材を容易に作成でき、学習者が行ごとの動作を確認できるシミュレーターを提供する。

## 2. 技術スタック
- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons), Framer Motion (Animations)
- **Deployment**: Vercel
- **Interpreter**: カスタム JavaScript ベース DNCL パーサー (Client-side)

## 3. ディレクトリ構造
```text
src/
├── app/
│   ├── layout.tsx       # 全体のレイアウト設計
│   ├── globals.css      # Progate風のカスタムスタイル定義
│   ├── page.tsx         # メインエディタ・シミュレーター画面
│   ├── lessons/
│   │   └── page.tsx     # レッスン一覧（学習マップ）
│   ├── reference/
│   │   └── page.tsx     # 文法リファレンス
│   └── slides/
│       └── page.tsx     # 公式仕様ベースの学習スライド
├── components/          # 共通コンポーネント
├── constants/
│   └── lessons.ts       # レッスンデータおよびマスタの定義
└── styles/
```

## 4. DNCL インタプリタ仕様
- **実装方式**: 行単位の逐次解析および擬似VMによる状態管理。
- **データ型**: 数値（整数・実数）、文字列、配列（1次元・2次元）。
- **制御構文**: 
  - `もし〜ならば` (if-else)
  - `〜の間繰り返す` (while)
  - `〜を〜から〜まで増やす` (for)
- **可視化**: 実行プロセスの各ステップにおける `変数 (variables)` と `配列 (arrays)` の状態をスナップショットとして保存・表示。

## 5. 実装済み機能
- [x] インタラクティブ・エディタ (Auto-save対応)
- [x] ステップ実行シミュレーター (再生/一時停止/速度調整)
- [x] 内部メモリのビジュアライザ
- [x] レッスンパス・マップ UI
- [x] 検索機能付き文法リファレンス
- [x] スライド形式のインプット学習

## 6. 未実装・プロトタイプ項目 (Mockups)
- [ ] ユーザー認証 (Cognito/Auth.js 検討中)
- [ ] データベース連携 (Supabase/PostgreSQL 予定)
- [ ] ポイント・XPの計算ロジック
- [ ] 正誤判定 (Judge System) の自動化
- [ ] レッスン完了情報のクラウド保存

## 7. 開発コマンド
- 開発サーバー起動: `npm run dev`
- ビルド: `npm run build`
- 実行: `npm start`
