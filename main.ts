import bun from "bun";
import { SQL } from "bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import mariadb from "mariadb";
const app = new Hono();

import routes from "./routes.js";
import { getTokenSourceMapRange } from "typescript";

app.use(
  "*",
  cors({
    origin: "*",
  }),
);
app.use("/*", serveStatic({ root: "public/" }));

async function main() {
  const db = new SQL({
    // Required
    url: "postgres://raspberry:rasp@0.0.0.0:5432/hazl",

    bigint: true,
  
    // Callbacks
    onconnect: client => {
      console.log("Connected to database");
    },
    onclose: client => {
      console.log("Connection closed");
    },
  });
  
  const conn = await db.connect();
  
  routes(app, conn);
  
  bun.serve({
    port: 5000,
    fetch: app.fetch,
    certFile: "/etc/letsencrypt/live/animenetwork.org/fullchain.pem",
    keyFile: "/etc/letsencrypt/live/animenetwork.org/privkey.pem",
  });
}

main();
