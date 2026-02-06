import type { Schema } from "hono";

import { OpenAPIHono } from "@hono/zod-openapi";
import { requestId } from "hono/request-id";

import { cors } from "hono/cors";

import { pinoLogger } from "@/middlewares/pino-logger";
import { notFound, onError, serveEmojiFavicon } from "@/utils/middlewares";
import { defaultHook } from "@/utils/openapi";

import type { AppBindings, AppOpenAPI } from "./types";
import env from "./env";

export function createRouter() {
    return new OpenAPIHono<AppBindings>({
        strict: false,
        defaultHook,
    });
}

export default function createApp() {
    const app = createRouter();
    app.use(requestId())
        .use(serveEmojiFavicon("👔"))
        .use(pinoLogger())
        .use(cors({ origin: env.FRONTEND_URL, credentials: true }));

    app.notFound(notFound);
    app.onError(onError);
    return app;
}

export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
    return createApp().route("/api", router);
}
