import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["fhevmjs"],
    include: ["keccak", "bigint-buffer"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
  },
}));
