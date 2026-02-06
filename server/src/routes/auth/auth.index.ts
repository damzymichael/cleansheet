import { createRouter } from "@/lib/create-app";

import * as handlers from "./auth.handlers";
import * as routes from "./auth.routes";

const _router = createRouter()
    .openapi(routes.signup, handlers.signup)
    .openapi(routes.login, handlers.login)
    .openapi(routes.logout, handlers.logout);

const router = createRouter().route("/auth", _router);

export default router;
