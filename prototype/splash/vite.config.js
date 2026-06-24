import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { "@": path.resolve(__dirname, "./src") },
    },
    build: {
        rollupOptions: {
            output: {
                // Split the big statically-imported vendors into their own long-cached
                // chunks so they fetch in parallel and survive app-code redeploys.
                // NOTE: @splinetool/* is intentionally NOT listed — it's a dynamic
                // import (see splite.tsx), so Vite already gives it its own chunk that
                // loads only when the robot panel mounts. Forcing it here would pull it
                // back into the eager graph and undo that deferral.
                manualChunks: function (id) {
                    if (!id.includes("node_modules"))
                        return;
                    if (id.includes("/react-dom/") ||
                        id.includes("/react/") ||
                        id.includes("/scheduler/") ||
                        id.includes("react/jsx-runtime"))
                        return "react-vendor";
                    if (id.includes("framer-motion") || id.includes("/motion-dom/"))
                        return "framer-motion";
                },
            },
        },
    },
});
