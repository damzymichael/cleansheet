import { createRoute } from "@hono/zod-openapi";

import { createRouter } from "@/lib/create-app";
import * as HttpStatusCodes from "@/utils/http-status-codes";
import { jsonContent } from "@/utils/openapi/helpers";
import { createMessageObjectSchema } from "@/utils/openapi/schemas";

const router = createRouter().openapi(
    createRoute({
        tags: ["Index"],
        method: "get",
        path: "/",
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                createMessageObjectSchema("Drycleaning Business API"),
                "Drycleaning business API Index",
            ),
        },
    }),
    c => {
        return c.json({ message: "Drycleaning API" }, HttpStatusCodes.OK);
    },
);

export default router;
