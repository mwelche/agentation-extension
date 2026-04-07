import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// Shared Vite config — the build script (scripts/build.mjs) calls vite.build()
// multiple times with entry-specific overrides layered on top of this.
export default defineConfig({
  plugins: [preact()],
  css: {
    modules: {
      // Match the scoped name format from the old tsup build for easier debugging
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
  },
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
});
