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

var hourUtil: Array<{
  value: number;
  timestampHour: number;
  timestampMin: number;
}> = [];

function handleHourUtil(
  value: number,
  timestampHour: number,
  timestampMin: number,
) {
  const index = hourUtil.findIndex((minute) => {
    return (
      minute.timestampHour == timestampHour &&
      minute.timestampMin == timestampMin
    );
  });

  if (index != -1) {
    hourUtil[index].value += value;
    return;
  }

  hourUtil.push({
    value: value,
    timestampHour: timestampHour,
    timestampMin: timestampMin,
  });
  if (hourUtil.length > 60) hourUtil.shift();
}

function hourInterval() {
  handleHourUtil(0, new Date().getHours(), new Date().getMinutes());
  const now: Date = new Date();
  const later: Date = new Date(now);
  later.setMinutes(later.getMinutes() + 1, 0, 0);
  const difference = later.getTime() - now.getTime();
  setTimeout(hourInterval, difference);
}

// Handler for logging requests and CORS Origin
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  handleHourUtil(1, new Date().getHours(), new Date().getMinutes());
  next();
});

app.get("/dashboard/getHour", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "application/json")
    .send(JSON.stringify(hourUtil));
});

app.listen(PORT, () => {
  console.log("Server running on Port: %s", PORT);
  hourInterval();
});
