import { eq } from "drizzle-orm";
import { setCookie } from "hono/cookie";
import * as HttpStatusCodes from "@/utils/http-status-codes";
import jwt from "jsonwebtoken";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { users } from "@/db/schema";
import { LoginRoute, LogoutRoute, SignupRoute } from "./auth.routes";
//import bcrpyt from "bcrypt";
import env from "@/lib/env";
import { SECURITY_CONFIG } from "@/lib/constants";

export const signup: AppRouteHandler<SignupRoute> = async c => {
    const user = c.req.valid("json");
    const anyUserExists = await db.query.users.findFirst({ columns: { email: true } });

    if (anyUserExists) {
        if (user.role === "owner") {
            return c.json({ message: "Owner account exists" }, HttpStatusCodes.FORBIDDEN);
        }
        await db.insert(users).values(user).returning();
        return c.json({ message: "User created successfully" }, HttpStatusCodes.CREATED);
    }

    const { role, ...others } = user;
    await db
        .insert(users)
        .values({ ...others, role: "owner" })
        .returning();
    return c.json({ message: "User created successfully" }, HttpStatusCodes.CREATED);
};

export const login: AppRouteHandler<LoginRoute> = async c => {
    const data = c.req.valid("json");

    const user = await db.query.users.findFirst({
        where: eq(users.email, data.email),
        columns: { id: true, email: true, password: true },
    });

    if (!user) {
        return c.json({ message: "Incorrect username or password" }, HttpStatusCodes.BAD_REQUEST);
    }

    if (user.password !== data.password) {
        return c.json({ message: "Incorrect username or password" }, HttpStatusCodes.BAD_REQUEST);
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
        expiresIn: "30d",
    });

    setCookie(c, SECURITY_CONFIG.COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 60 * 60 * 24,
    });

    return c.json({ message: "Login successful" }, HttpStatusCodes.CREATED);
};

export const logout: AppRouteHandler<LogoutRoute> = async c => {
    setCookie(c, SECURITY_CONFIG.COOKIE_NAME, "", { maxAge: 0 });
    return c.json({ message: "Logout successful" }, HttpStatusCodes.OK);
};
