import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx, defineManifest } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({
      manifest,
      contentScripts: {
        preambleCode: false,
      },
    })
  ],
  server: {
    cors: {
      origin: "*",
    },
  },
});
