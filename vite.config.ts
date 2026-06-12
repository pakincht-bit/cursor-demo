import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const storyStackBundlePattern =
  /assets\/story-stack\/story-stack\.js(\?v=\d+)?/

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "story-stack-dev-entry",
      apply: "serve",
      transformIndexHtml(html) {
        return html.replace(
          storyStackBundlePattern,
          "/src/story-stack-mount.tsx"
        )
      },
    },
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "./assets/story-stack"),
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, "src/story-stack-mount.tsx"),
      formats: ["es"],
      fileName: "story-stack",
    },
    rollupOptions: {
      output: {
        assetFileNames: "story-stack[extname]",
      },
    },
  },
})
