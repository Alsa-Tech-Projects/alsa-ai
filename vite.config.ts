import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  build: {
    // es2015 thoda purana ho gaya hai, modern projects ke liye 'esnext' ya 'modules' better hai
    target: 'modules', 
    chunkSizeWarningLimit: 2000, // 1000 se badha do kyunki AI apps heavy hote hain
    rollupOptions: {
      output: {
        // Sabse safe tareeka: React aur Router ko ek saath rakho taaki context mismatch na ho
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
          'vendor-lib': ['@supabase/supabase-js', '@tanstack/react-query'],
        },
      },
    },
  },
  // Isko thoda aur clean rakhte hain
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ],
  },
}));
