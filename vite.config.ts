import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const bibleApiProxy = {
  "/bible-api": {
    target: "https://bible.helloao.org",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/bible-api/, ""),
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const scriptureKey = env.SCRIPTURE_API_KEY ?? "";

  const scriptureProxy = {
    "/scripture-api": {
      target: "https://api.scripture.api.bible/v1",
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/scripture-api/, ""),
      configure(proxy) {
        proxy.on("proxyReq", (proxyReq) => {
          if (scriptureKey) proxyReq.setHeader("api-key", scriptureKey);
        });
      },
    },
  };

  return {
    plugins: [react()],
    server: { proxy: { ...bibleApiProxy, ...scriptureProxy } },
    preview: { proxy: { ...bibleApiProxy, ...scriptureProxy } },
  };
});
