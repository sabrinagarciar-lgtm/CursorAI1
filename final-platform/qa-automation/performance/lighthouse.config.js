/**
 * Lighthouse CI configuration for ShopEase frontend.
 * Requires: npm i -g @lhci/cli && running frontend on E2E_BASE_URL
 */
export default {
  ci: {
    collect: {
      url: [
        process.env.E2E_BASE_URL || "http://127.0.0.1:5180/",
        (process.env.E2E_BASE_URL || "http://127.0.0.1:5180/") + "cart",
      ],
      numberOfRuns: 2,
      settings: {
        preset: "desktop",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "interactive": ["warn", { maxNumericValue: 4000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./results/performance/lighthouse",
    },
  },
};
