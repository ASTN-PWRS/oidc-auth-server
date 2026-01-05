import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  publicDir: "dummy",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
