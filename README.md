# Spring Basket - Physics Line Match Game

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure (FSD)

- `src/app`: Next.js App Router pages
- `src/features/basket-game`: Core game feature (model, ui, config, lib)
- `src/widgets/level-editor`: Level editor widget
- `src/shared`: Shared utilities and styles

## Features

- Physics-based gameplay using Matter.js
- Line matching mechanic
- 60 generated levels
- Level editor
- Boosters (Rake implemented, others extensible)
- Fruit Ninja style effects

## Дополнительная документация

- [Engineering Rules](./docs/engineering-rules.md) — общие правила разработки для игрового runtime, архитектуры и производительности.
