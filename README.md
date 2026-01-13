# 🧪 DNCL Sandbox Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

**DNCL Sandbox Studio** は、日本の「大学入学共通テスト」における「情報I」で採用されている手順記述標準言語 **DNCL** を、ブラウザ上で直感的に学習・実験できるプロフェッショナルなサンドボックス環境です。

[English Description follows Japanese]

---

## 🚀 特徴 (Features)

1. **リアルタイム・インタプリタ**:
   書いたコードをその場で解析し実行。ステップ実行や変数の変化を追跡できます。
2. **メモリ・ビジュアライザー**:
   DNCLの核となる「配列」の概念を視覚化。メモリアドレスの中身が書き換わる様子をリアルタイムにカード形式で表示します。
3. **プリセット・ライブラリ**:
   「最大値探索」「バブルソート」「合計計算」など、頻出のアルゴリズムを1クリックで呼び出し可能。
4. **モダンなUI/UX**:
   深みのあるインディゴを基調としたダークモード。プロフェッショナルな開発環境のような体験を提供します。
5. **永続化**:
   ブラウザのローカルストレージにより、書いたコードは自動的に保存されます。

---

## 🌏 What is DNCL?

**DNCL** (Daigaku Nyūgaku Kyōtsū Test Procedure Description Language) is a high-level pseudocode standard specifically designed for the Japanese University Entrance Common Test in "Informatics I". 

While it's primarily used in Japan, it provides an excellent entry point for understanding logic, sequences, and data structures. This sandbox brings that academic standard into a modern, interactive development environment.

### Why this sandbox?
- **For Students**: No setup required. Just code and see the logic move.
- **For Teachers**: Easily demonstrate complex algorithms like sorting and searching.
- **For Geeks**: Explore the unique logic of Japanese educational computer science.

---

## 🛠 テクノロジースタック (Tech Stack)

- **Frontend**: Next.js (App Router), React 19
- **Logic**: Custom DNCL Interpreter Engine (Client-side)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React

---

## 🏃‍♂️ 始め方 (Getting Started)

### Local Development

1. クローンする:
   ```bash
   git clone https://github.com/iidaatcnt/dncl-sandbox.git
   ```
2. 依存関係をインストール:
   ```bash
   npm install
   ```
3. サーバー起動:
   ```bash
   npm run dev
   ```

### Deployment

This project is optimized for **Vercel**. Simply connect your fork to Vercel and it will be live!

---

## 📄 License

MIT License - feel free to use and contribute!

---

Developed by **Antigravity** for the Future Informatics Series.
