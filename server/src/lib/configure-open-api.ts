import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "./types";

import packageJSON from "../../package.json" with { type: "json" };

import { SECURITY_CONFIG } from "./constants";

export default function configureOpenAPI(app: AppOpenAPI) {
    app.openAPIRegistry.registerComponent("securitySchemes", SECURITY_CONFIG.SECURITY_SCHEME_KEY, {
        type: "apiKey",
        in: "cookie",
        name: SECURITY_CONFIG.COOKIE_NAME, // Must match your getCookie(c, "jwt")
    });

    app.doc("/doc", {
        openapi: "3.0.0",
        info: { version: packageJSON.version, title: "Drycleaning Business API" },
    });

    app.get(
        "/reference",
        Scalar({
            url: "/doc",
            theme: "kepler",
            layout: "classic",
            defaultHttpClient: {
                targetKey: "js",
                clientKey: "fetch",
            },

            authentication: {
                preferredSecurityScheme: "CookieAuth",
            },
        }),
    );
}
