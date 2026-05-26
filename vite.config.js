import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), wasm(), tailwindcss()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  resolve: {
    alias: {
      buffer: "buffer/",
    },
  },
  optimizeDeps: {
    include: ["buffer", "tiny-secp256k1"],
    exclude: ["@bitcoinerlab/secp256k1"],
  },
  server: {
    port: 5173,
    open: true,
  },
});
