import { createRouter } from "@/lib/create-app";

import * as handlers from "./users.handlers";
import * as routes from "./users.route";

const _router = createRouter()
    .openapi(routes.createUser, handlers.createUser)
    .openapi(routes.getUsers, handlers.getUsers)
    .openapi(routes.getUser, handlers.getUser)
    .openapi(routes.deleteUser, handlers.deleteUser);

const router = createRouter().route("/user", _router);

export default router;
