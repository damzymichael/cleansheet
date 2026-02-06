// eslint-disable-next-line unused-imports/no-unused-imports
import { z } from "@hono/zod-openapi";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { v4 as uuidv4 } from "uuid";

import { toZodV4SchemaTyped } from "@/lib/zod-utils";

export const users = sqliteTable("users", {
    id: text({ length: 36 })
        .primaryKey()
        .$defaultFn(() => uuidv4()),
    email: text().unique().notNull(),
    name: text().notNull(),
    password: text().notNull(),
    role: text({ enum: ["staff", "owner"] })
        .notNull()
        .default("staff"),
    createdAt: integer({ mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp" })
        .$defaultFn(() => new Date())
        .$onUpdate(() => new Date()),
});

export const selectUserSchema = toZodV4SchemaTyped(
    createSelectSchema(users).omit({ password: true, createdAt: true, updatedAt: true }),
);

export const insertUserSchema = toZodV4SchemaTyped(
    createInsertSchema(users, {
        email: field => field.email(),
        name: field => field.min(1).max(255),
        password: field => field.min(8),
    })
        .required({ password: true })
        .omit({ id: true, createdAt: true, updatedAt: true }),
);

export const loginUserSchema = toZodV4SchemaTyped(
    createInsertSchema(users, {
        email: field => field.email(),
        password: field => field.min(8),
    })
        .required({ password: true })
        .omit({ id: true, createdAt: true, updatedAt: true, name: true, role: true }),
);

// @ts-expect-error partial exists on zod v4 type
export const patchUsersSchema = insertUserSchema.partial().omit({ email: true });

export const tasks = sqliteTable("tasks", {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    done: integer({ mode: "boolean" }).notNull().default(false),
    createdAt: integer({ mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp" })
        .$defaultFn(() => new Date())
        .$onUpdate(() => new Date()),
});

export const selectTasksSchema = toZodV4SchemaTyped(createSelectSchema(tasks));

export const insertTasksSchema = toZodV4SchemaTyped(
    createInsertSchema(tasks, {
        name: field => field.min(1).max(500),
    })
        .required({ done: true })
        .omit({ id: true, createdAt: true, updatedAt: true }),
);

// @ts-expect-error partial exists on zod v4 type
export const patchTasksSchema = insertTasksSchema.partial();
