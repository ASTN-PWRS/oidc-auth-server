import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

export default defineConfig({
  publicDir: "dummy",
  build: {
    outDir: "public/shoelace",
    emptyOutDir: false,
    rollupOptions: {
      input: "./resources/main.js",
      output: {
        entryFileNames: "shoelace.js",
        assetFileNames: "shoelace[extname]",
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@shoelace-style/shoelace/dist/assets",
          dest: "",
        },
      ],
    }),
  ],
});
