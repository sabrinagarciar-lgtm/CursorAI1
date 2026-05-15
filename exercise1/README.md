# Exercise 1 — E-commerce Product Card

A Create React App demo that showcases a reusable **ProductCard** for an e-commerce-style UI: product image, title, description, price, star rating, and an **Add to Cart** action. Props are typed with **TypeScript**, layout and motion use **Tailwind CSS**, and the layout is responsive with hover-focused polish and accessibility-minded markup.

## Purpose

- **ProductCard** — Presents product media, copy, formatted price, and a primary CTA.
- **TypeScript** — Shared types for products, card props, and ratings (`src/types/product.ts`).
- **Tailwind CSS** — Utility-first styling, responsive breakpoints, transitions, and hover/focus states.
- **Motion & hover** — Card lift (`translate` + shadow), image scale on hover, smooth transitions on interactive elements.
- **Accessibility** — Semantic `<article>` with `aria-labelledby`, descriptive image `alt` text, keyboard-focus rings on the card and button, `aria-label` on **Add to Cart**, star rating exposed as `role="img"` with a text summary, cart count as `aria-live="polite"`, and [schema.org](https://schema.org/) `Product` / `Offer` hints where appropriate.

The home view is **`ProductDemo`**: a responsive grid of sample products backed by static demo data.

## Requirements

- **Node.js** 18+ (LTS recommended) and **npm**.

## Setup

1. From this directory (`exercise1/exercise1`):

   ```bash
   npm install --legacy-peer-deps
   ```

   `react-scripts@5` declares an optional peer range for TypeScript 3–4; this project uses TypeScript 5, so `--legacy-peer-deps` avoids an install-time peer conflict. The app builds and runs as expected.

2. Start the development server:

   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000). The demo loads automatically (`App` renders `ProductDemo`).

3. Optional: avoid launching a browser from the CLI:

   ```bash
   BROWSER=none npm start
   ```

4. Other scripts:

   | Command        | Description                    |
   | -------------- | ------------------------------ |
   | `npm test`     | Jest / React Testing Library   |
   | `npm run build` | Production build to `build/` |

### Troubleshooting

- **`EMFILE: too many open files` (watch mode)** — On macOS, file watcher limits can be tight. In the same terminal, try `ulimit -n 10240` before `npm start`, or see [Create React App — troubleshooting](https://facebook.github.io/create-react-app/docs/troubleshooting).

## Project structure

```text
.                             ← Create React App root (this folder)
├── docs/
│   └── demo-screenshot.png   ← screenshot of the Product Showcase demo
├── public/
│   ├── index.html
│   └── …
├── src/
│   ├── components/
│   │   ├── ProductCard.tsx   # Card layout, CTA, image fallback
│   │   ├── RatingStars.tsx   # Accessible star display + partial star
│   │   └── TaskList.tsx
│   ├── pages/
│   │   └── ProductDemo.tsx   # Demo grid + cart state
│   ├── types/
│   │   └── product.ts        # Product, ProductCardProps, RatingStarsProps
│   ├── App.js                # Entry view → ProductDemo
│   ├── App.css
│   ├── index.js
│   └── index.css             # Tailwind directives
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

One level up, the enclosing **exercise 1** folder has a short README that links into this project.

## Demo screenshot

Product Showcase page at `http://localhost:3000`:

![Product Showcase demo — responsive grid of ProductCard components with ratings and Add to Cart](docs/demo-screenshot.png)

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). Additional CRA topics (testing, deployment, etc.) remain documented in the [CRA documentation](https://facebook.github.io/create-react-app/docs/getting-started).
