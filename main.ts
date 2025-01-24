import express, { Express, NextFunction, Request, Response } from "express";
import mariadb from "mariadb";
const app = express();

import routes from "./routes.js";

app.use(express.json());
app.use(express.text({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const PORT: number = 5000;

const pool = mariadb.createPool({
  host: "raspberrypi",
  user: "anime_web",
  password: "anime_web",
  database: "zeph",
});

routes(app, pool);

// Handler for logging requests and CORS Origin
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", [
    "Authorization",
    "Content-Type",
  ]);
  next();
});

app.listen(PORT, () => {
  console.log("Server running on Port: %s", PORT);
});
