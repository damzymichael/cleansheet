import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            devOptions: {
                enabled: true,
            },
            manifest: {
                name: "Laundry Management",
                display: "standalone",
                display_override: ["window-controls-overlay"],
                short_name: "Laundry",
                description: "Cloud-based laundry management system",
                theme_color: "#4f46e5",
                icons: [
                    {
                        src: "/android/launchericon-48x48.png",
                        sizes: "48x48",
                        type: "image/png",
                    },
                    {
                        src: "/android/launchericon-72x72.png",
                        sizes: "72x72",
                        type: "image/png",
                    },
                    {
                        src: "/android/launchericon-96x96.png",
                        sizes: "96x96",
                        type: "image/png",
                    },
                    {
                        src: "/android/launchericon-144x144.png",
                        sizes: "144x144",
                        type: "image/png",
                    },
                    {
                        src: "/android/launchericon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/android/launchericon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/ios/180.png",
                        sizes: "180x180",
                        type: "image/png",
                    },
                    {
                        src: "/windows/Square44x44Logo.scale-100.png",
                        sizes: "44x44",
                        type: "image/png",
                    },
                    {
                        src: "/windows/Square150x150Logo.scale-100.png",
                        sizes: "150x150",
                        type: "image/png",
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
