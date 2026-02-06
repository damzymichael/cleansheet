import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "@/utils/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "@/utils/openapi/schemas";
import { insertUserSchema, loginUserSchema, selectUserSchema } from "@/db/schema";

import * as HttpStatusCodes from "@/utils/http-status-codes";
import { notFoundSchema } from "@/lib/constants";

const tags = ["Auth"];

export const signup = createRoute({
    path: "/signup",
    method: "post",
    request: {
        body: jsonContentRequired(insertUserSchema, "The user to create"),
    },
    tags,
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(z.object({ message: z.string() }), "Signup successful"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(insertUserSchema),
            "The validation error(s)",
        ),
        [HttpStatusCodes.FORBIDDEN]: jsonContent(z.object({ message: z.string() }), "Action not allowed"),
    },
});

export const login = createRoute({
    path: "/login",
    method: "post",
    request: {
        body: jsonContentRequired(loginUserSchema, "User login credentials"),
    },
    tags,
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(z.object({ message: z.string() }), "Login successful"),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(insertUserSchema),
            "The validation error(s)",
        ),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(z.object({ message: z.string() }), "Incorrect login credentials"),
    },
});

export const logout = createRoute({
    path: "/logout",
    method: "post",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.object({ message: z.string() }), "Logout successful"),
    },
});

export type SignupRoute = typeof signup;
export type LoginRoute = typeof login;
export type LogoutRoute = typeof logout;
