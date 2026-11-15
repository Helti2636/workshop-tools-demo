import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build works on GitHub Pages (served from a sub-path)
// and when embedded in another page. The build goes to /docs, which GitHub
// Pages can serve straight from the main branch.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "docs", emptyOutDir: true },
});
