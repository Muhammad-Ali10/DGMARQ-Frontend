import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import fs from "fs"

// HTTPS configuration for PayPal CardFields (requires secure connection)
const httpsConfig = (() => {
  const keyPath = path.resolve(__dirname, './localhost-key.pem');
  const certPath = path.resolve(__dirname, './localhost.pem');
  
  // Check if certificates exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }
  
  // If certificates don't exist, return null (will use HTTP)
  // User should run: npm run generate-certs (see package.json)
  console.warn('⚠️  HTTPS certificates not found. PayPal CardFields requires HTTPS.');
  console.warn('⚠️  Run "npm run generate-certs" to generate self-signed certificates for local development.');
  return null;
})();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
      
    },
  },
  server: {
    https: httpsConfig, // Enable HTTPS for PayPal CardFields
    port: 5173,
    hmr: {
      clientPort: 5173,
      protocol: httpsConfig ? 'wss' : 'ws', // Use secure WebSocket if HTTPS is enabled
    },
    // Strictly enforce HTTPS in production
    strictPort: false,
  },
  optimizeDeps: {
    include: ['clsx', 'tailwind-merge', 'class-variance-authority'],
  },
  build: {
    minify: 'esbuild',
    // Remove console statements and debugger in production builds
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
})