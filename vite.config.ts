import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["logo.svg", "favicon.svg", "robots.txt"],
      manifest: {
        name: "PedidoClaro — POS para restaurantes",
        short_name: "PedidoClaro",
        description: "Sistema de Punto de Venta para restaurantes. Gestioná pedidos, caja en USD y Bs.",
        theme_color: "#ef4444",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "default-logo.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "default-logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "default-logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
