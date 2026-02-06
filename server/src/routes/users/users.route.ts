import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "@/utils/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "@/utils/openapi/schemas";
import { insertUserSchema, selectUserSchema } from "@/db/schema";

import * as HttpStatusCodes from "@/utils/http-status-codes";

import { notFoundSchema } from "@/lib/constants";
import { authMiddleware } from "@/middlewares/auth-middleware";
import { SECURITY_CONFIG } from "@/lib/constants";

const tags = ["Users"];

export const createUser = createRoute({
    path: "/create",
    method: "post",
    summary: "Creates new users(staff)",
    request: {
        body: jsonContentRequired(insertUserSchema, "The user to create"),
    },
    tags,
    middleware: [authMiddleware],
    security: [{ [SECURITY_CONFIG.SECURITY_SCHEME_KEY]: [] }],
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(z.object({ message: z.string() }), "User created successfully"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(insertUserSchema),
            "The validation error(s)",
        ),
        [HttpStatusCodes.FORBIDDEN]: jsonContent(z.object({ message: z.string() }), "Action not allowed"),
    },
});

export const getUsers = createRoute({
    path: "/get",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(selectUserSchema), "Get all users"),
    },
});

// Todo Unprocessable entity
export const getUser = createRoute({
    path: "/get/{id}",
    method: "get",
    request: { params: IdUUIDParamsSchema },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(selectUserSchema, "User returned successfully"),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "User not found"),
    },
});

// Todo Unprocessable entity
export const deleteUser = createRoute({
    path: "/delete/{id}",
    method: "delete",
    request: { params: IdUUIDParamsSchema },
    tags,
    responses: {
        [HttpStatusCodes.NO_CONTENT]: { description: "User deleted" },
        [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "User not found"),
    },
});

export type CreateUserRoute = typeof createUser;
export type GetUsersRoute = typeof getUsers;
export type GetUserRoute = typeof getUser;
export type DeleteUserRoute = typeof deleteUser;
