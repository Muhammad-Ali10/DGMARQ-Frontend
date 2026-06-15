import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import fs from "fs"
// PERF FIX (FP2): bundle attribution, opt-in only — `ANALYZE=1 npm run build`
// writes dist/stats.html. No effect on normal builds.
import { visualizer } from "rollup-plugin-visualizer"

// HTTPS configuration for PayPal CardFields (requires secure connection)
const httpsConfig = (() => {
  const keyPath = path.resolve(__dirname, './localhost-key.pem');
  const certPath = path.resolve(__dirname, './localhost.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  console.warn('HTTPS certificates not found. PayPal CardFields requires HTTPS.');
  console.warn('Run "npm run generate-certs" to generate self-signed certificates.');
  return null;
})();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.ANALYZE
      ? [visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true })]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@context": path.resolve(__dirname, "./src/context"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@constants": path.resolve(__dirname, "./src/constants"),
    },
  },
  server: {
    https: httpsConfig,
    port: 5173,
    hmr: {
      clientPort: 5173,
      protocol: httpsConfig ? 'wss' : 'ws',
    },
    strictPort: false,
  },
  optimizeDeps: {
    include: ['clsx', 'tailwind-merge', 'class-variance-authority'],
  },
  build: {
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    // Chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — rarely changes, cached long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // State management
          'vendor-state': ['@reduxjs/toolkit', 'react-redux', '@tanstack/react-query'],
          // UI framework
          'vendor-ui': ['lucide-react', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          // Heavy libraries (zod removed — dependency was unused and uninstalled)
          'vendor-forms': ['react-hook-form', '@hookform/resolvers'],
          // Networking
          'vendor-network': ['axios', 'socket.io-client'],
        },
      },
    },
    // Warn on large chunks
    chunkSizeWarningLimit: 500,
  },
})
