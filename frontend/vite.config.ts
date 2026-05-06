import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ripple/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  server: {
    // Dedicated port — 5173 is often taken by other tools; strictPort avoids silent fallback.
    port: 5188,
    strictPort: true,
    headers: {
      "Cache-Control": "no-store",
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
