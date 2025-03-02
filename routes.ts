import path from "path";
import { SQL } from "bun";
import mariadb from "mariadb";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { Hono } from "hono";

export default function (app: Hono, conn: SQL) {
  app.post("/avatar-upload", async (c) => {
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const body = await c.req.parseBody();
      const file = body.file;

      if (!file) {
        return c.text("No files were uploaded", 400);
      }

      const filename = Date.now() + "-" + file.name;
      const filepath = path.join(__dirname, `/public/${filename}`);

      await Bun.write(filepath, file);

      await conn`UPDATE users SET avatar_url = /${filename} WHERE user_id = ${(<any>decoded).userId}`;
      return c.json({ url: `/${filename}` }, 200);
    } catch (e) {
      return c.text("", 500);
    }
  });

  app.get("/get-user", async (c) => {
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const user = await conn`
          Select username, avatar_url FROM users WHERE user_id = ${
            (<any>decoded).userId
          }
        `;
      return c.json(user[0], 201);
    } catch (error) {
      return c.json({ error: "Invalid token" }, 401);
    }
  });

  app.post("/auth-register", async (c) => {
    try {
      const { username, password } = await c.req.parseBody();
      const hashedpassword = bcrypt.hash(password, 10);

      const query =
        await conn`INSERT INTO users (username, password_hash) VALUES ('${username}', '${hashedpassword}')`;

      console.log(query);

      return c.json({ message: "User registered successfully" }, 201);
    } catch (error) {
      console.log(error);
      return c.json({ message: "Registration failed" }, 500);
    }
  });

  app.post("/auth-login", async (c) => {
    try {
      const { username, password } = await c.req.parseBody();
      const user = await conn`SELECT * FROM users WHERE username=${username}
      `;
      console.log(user);
      if (!user) {
        return c.json({ error: "Authentication failed" }, 401);
      }
      const passwordMatch = bcrypt.compare(password, user[0].password_hash);
      if (!passwordMatch) {
        return c.json({ error: "Authentication failed" }, 401);
      }
      const token = jwt.sign({ userId: user[0].user_id }, "your-secret-key");
      return c.json({ token }, 200);
    } catch (error) {
      console.log(error);
      return c.json({ error: "Login failed" }, 500);
    }
  });
  // Routes for seen/unseen
  app.post("/get-seen", async (c) => {
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Access denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const urls = await c.req.json();

      const seen = [];

      for (const url of urls) {
        const query = await conn`
        SELECT episode_id, watch_playtime, watch_duration
        FROM watch_history
        WHERE user_id = ${(<any>decoded).userId}
        AND episode_id = ${url}`;

        if (query.length !== 0) {
          seen.push(query[0]);
          continue;
        } else {
          continue;
        }
      }

      return c.json(seen, 200);
    } catch (error) {
      console.log(error);
      return c.json({ error: "Invalid token" }, 401);
    }
  });

  interface Entry {
    playtime: Number;
    duration: Number;
    redirect: String;
  }

  app.post("/handle-seen", async (c) => {
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");
      const data = await c.req.json();

      await conn`
        INSERT INTO watch_history (user_id, episode_id, watch_playtime, watch_duration)
        VALUES (${(<any>decoded).userId}, ${data.id}, ${data.playtime}, ${data.duration})
        ON CONFLICT(user_id, episode_id) DO UPDATE
            SET watch_playtime = excluded.watch_playtime,
            watch_duration = excluded.watch_duration`;

      return c.text("", 200);
    } catch (error) {
      return c.json({ error: "Invalid token" }, 401);
    }
  });

  // routes for marked
  app.get("/get-list", async (c) => {
    const token = c.req.header("Authorization");

    if (!token) return c.json({ error: "Access denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");
      const page = c.req.query("page");

      if (typeof page !== "string") throw new Error("No page provided");

      const marked =
        await conn`SELECT series_id from user_watchlist WHERE user_id = ${(<any>decoded).userId} AND is_in_list = TRUE LIMIT 21 OFFSET ${parseInt(page) * 21};`;

      return c.json(marked, 200);
    } catch (error) {
      console.log(error);
      return c.json({ error: error }, 401);
    }
  });

  app.post("/get-marked", async (c) => {
    const token = c.req.header("Authorization");

    if (!token) return c.json({ error: "Access denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const marked =
        await conn`SELECT is_in_list from user_watchlist WHERE user_id = ${(<any>decoded).userId} AND series_id = ${await c.req.text()}`;

      return c.json(marked, 200);
    } catch (error) {
      return c.json({ error: "Error" }, 401);
    }
  });

  app.post("/handle-marked", async (c) => {
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");
      const url = await c.req.text();

      await conn`
        INSERT INTO user_watchlist (user_id, series_id, is_in_list)
        VALUES (${(<any>decoded).userId}, ${url}, true)
        ON CONFLICT(user_id, series_id) DO UPDATE
            SET is_in_list = NOT user_watchlist.is_in_list;`;

      return c.text("", 200);
    } catch (error) {
      console.log(error);
      return c.json({ error: "Invalid token" }, 401);
    }
  });

  app.post("/get-anime", async (c) => {
    const url = await c.req.text();

    if (url.length == 0) return c.text("", 500);

    const anime = await conn`
      SELECT * FROM anime WHERE url = ${url};`;

    if (anime.length !== 0) {
      return c.json(anime[0], 200);
    } else {
      return c.text("", 404);
    }
  });

  app.post("/set-anime", async (c) => {
    if ((await c.req.text()).length == 0) return c.text("", 500);

    const json = JSON.parse(await c.req.text());

    if (
      typeof json.redirect == "undefined" ||
      typeof json.title == "undefined" ||
      typeof json.image == "undefined"
    )
      return c.text("", 500);

    await conn`
      INSERT INTO anime (url, title, image) VALUES (${json.redirect}, ${json.title}, ${json.image})`;

    return c.text("", 200);
  });

  app.post("/user/activity/update", async (c) => {
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");
      const activityObj = await c.req.json();
      console.log(activityObj);
      if (
        !activityObj.time ||
        !activityObj.day ||
        !activityObj.month ||
        !activityObj.year
      )
        throw new Error("Crucial data is missing!");

      await conn`INSERT INTO watch_activity (id, time, date, month, year) VALUES (${(<any>decoded).userId}, ${activityObj.time}, ${activityObj.day}, ${activityObj.month}, ${activityObj.year}) ON CONFLICT(id, date, month, year) DO UPDATE SET time = watch_activity.time + excluded.time;`;

      return c.text("", 200);
    } catch (error) {
      console.log(error);
      return c.json({ error: "Invalid token" }, 401);
    }
  });

  app.get("/user/activity/last-month", async (c) => {
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const activity = await conn`SELECT time, date, month, year
        FROM watch_activity
        WHERE id = ${(<any>decoded).userId} AND MAKE_DATE(year, month, date) > CURRENT_DATE - INTERVAL '31 days'
        ORDER BY year, month, date, time;`;

      return c.json(activity, 200);
    } catch (error) {
      console.log(error);
      return c.json({ error: "Invalid token" }, 401);
    }
  });
}
