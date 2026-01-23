import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // --- YAHAN SE CHANGES HAIN ---
  build: {
    chunkSizeWarningLimit: 1000, // 1MB tak warning nahi dega
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Ye har library (node_modules) ko alag file mein baante ga
          if (id.includes('node_modules')) {
            return id
              .toString()
              .split('node_modules/')[1]
              .split('/')[0]
              .toString();
          }
        },
      },
    },
  },
  // --- CHANGES KHATAM ---
}));
