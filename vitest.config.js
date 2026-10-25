import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["js/items.js", "js/app.js"],
      reporter: ["text", "html"],
      thresholds: { lines: 43, functions: 39, branches: 40, statements: 43 },
    },
  },
});


