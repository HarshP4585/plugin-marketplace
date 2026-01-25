import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      formats: ["iife"],
      name: "PluginSlack",
      fileName: () => "index.esm.js",
    },
    rollupOptions: {
      // Externalize peer dependencies that will be provided by VerifyWise
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@mui/material",
        "@emotion/react",
        "@emotion/styled",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "@mui/material": "MUI",
          "@emotion/react": "emotionReact",
          "@emotion/styled": "emotionStyled",
        },
      },
    },
    outDir: "dist",
    sourcemap: true,
  },
});
