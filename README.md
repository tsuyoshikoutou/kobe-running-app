# Kobe Running App

神戸のランナーのためのランニングコース共有・管理アプリケーションです。自身の記録を管理したりすることを目的としています。

## 🚀 特徴

* **コース検索・表示**: 主要なランニングコースを地図上で確認できます。
* **インタラクティブマップ**: Leaflet（またはGoogle Maps API）を使用し、視覚的にコースを把握。
* **レスポンシブデザイン**: スマートフォンからも快適に操作可能（Tailwind CSS採用）。
* **最新のスタック**: Next.js と TypeScript を利用した高速で安全な動作。

## 🛠 使用技術

* **Frontend**: [Next.js](https://nextjs.org/) (App Router)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Maps**: [Leaflet](https://leafletjs.com/) / [React Leaflet](https://react-leaflet.js.org/)
* **Icons**: [Lucide React](https://lucide.dev/)

## 📦 セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/tsuyoshikoutou/kobe-running-app.git
cd kobe-running-app

```

### 2. 依存関係のインストール

```bash
npm install
# または
yarn install

```

### 3. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev

```

ブラウザで [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) を開き、アプリケーションを確認できます。

## 📂 ディレクトリ構成

* `/app`: Next.js のページコンポーネントとルーティング
* `/components`: 再利用可能なUIコンポーネント
* `/public`: 画像、地図データ、静的資産
* `/hooks`: カスタムフック
* `/types`: TypeScript の型定義

## 📝 今後のロードマップ (予定)

* [ ] ユーザーログイン機能（Firebase / NextAuth.js）
* [ ] GPXファイルのアップロード・エクスポート
* [ ] 神戸市公式オープンデータとの連携
* [ ] コースごとの高低差グラフ表示

## 🤝 貢献について

バグ報告や機能提案は、Issue または Pull Request にて受け付けています。

## 📄 ライセンス

[MIT License](https://www.google.com/search?q=LICENSE)
