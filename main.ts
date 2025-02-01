import bun from "bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import mariadb from "mariadb";
const app = new Hono();

import routes from "./routes.js";

app.use(
  "*",
  cors({
    origin: "*",
  }),
);
app.use("/*", serveStatic({ root: "public/" }));

const pool = mariadb.createPool({
  host: "raspberrypi",
  user: "anime_web",
  password: "anime_web",
  database: "zeph",
});

routes(app, pool);

bun.serve({
  port: 5000,
  fetch: app.fetch,
});
