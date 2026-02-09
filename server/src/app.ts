import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import index from "@/routes/index.route";
import tasks from "@/routes/tasks/tasks.index";
import users from "@/routes/users/users.index";
import auth from "@/routes/auth/auth.index";

const app = createApp();

configureOpenAPI(app);

const routes = [index, auth, users, tasks] as const;

routes.forEach(route => {
    app.route("/api", route);
});

export type AppType = (typeof routes)[number];

export default app;