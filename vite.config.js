import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"),
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
