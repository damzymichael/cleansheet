import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "@/utils/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { users } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";

import type { CreateUserRoute, DeleteUserRoute, GetUserRoute, GetUsersRoute } from "./users.route";

export const createUser: AppRouteHandler<CreateUserRoute> = async c => {
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

// Todo Should return all users except the owner
export const getUsers: AppRouteHandler<GetUsersRoute> = async c => {
    const users = await db.query.users.findMany({
        columns: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return c.json(users);
};

export const getUser: AppRouteHandler<GetUserRoute> = async c => {
    const { id } = c.req.valid("param");

    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) {
        return c.json({ message: "User not found" }, HttpStatusCodes.NOT_FOUND);
    }

    return c.json(user, HttpStatusCodes.OK);
};

export const deleteUser: AppRouteHandler<DeleteUserRoute> = async c => {
    const { id } = c.req.valid("param");

    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
    });

    if (!user) {
        return c.json({ message: "User not found" }, HttpStatusCodes.NOT_FOUND);
    }

    await db.delete(users).where(eq(users.id, id));
    return c.body(null, HttpStatusCodes.NO_CONTENT);
};
