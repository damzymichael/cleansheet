import jwt from "jsonwebtoken";
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import env from "@/lib/env";
import * as HttpStatusCodes from "@/utils/http-status-codes";
import * as HttpStatusPhrases from "@/utils/http-status-phrases.js";
import { SECURITY_CONFIG } from "@/lib/constants";

export const authMiddleware = createMiddleware(async (c, next) => {
    // Get the token from the "jwt" cookie
    const token = getCookie(c, SECURITY_CONFIG.COOKIE_NAME);

    if (!token) {
        return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED);
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        c.set("userId", (decoded as any).userId); // Assuming your JWT payload has a userId
        await next();
    } catch (error) {
        return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED);
    }
});
