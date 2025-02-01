import path from "path";
import fs from "fs";
import mariadb from "mariadb";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { Hono } from "hono";

export default function (app: Hono, pool: mariadb.Pool) {
  app.post("/avatar-upload", async (c) => {
    const conn = await pool.getConnection();
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const body = await c.req.parseBody();
      const file = body["file"];
      if (!file) {
        return c.text("No files were uploaded", 400);
      }

      // Generate unique filename
      const filename = Date.now() + "-" + file.name;
      const filepath = path.join(__dirname, `/public/${filename}`);

      // Save the file
      fs.writeFile(filepath, file.data, (err) => {
        if (err) throw new Error(err);
      });

      await conn.query("UPDATE users SET avatar_url = ? WHERE user_id = ?", [
        `/${filename}`,
        (<any>decoded).userId,
      ]);
      return c.json({ url: `/${filename}` }, 200);
    } catch (e) {
      return c.text("", 500);
    } finally {
      conn.release();
    }
  });

  app.get("/get-user", async (c) => {
    const conn = await pool.getConnection();
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const user = await conn.query(
        "Select username, avatar_url FROM users WHERE user_id = ?",
        (<any>decoded).userId,
      );
      return c.json(user[0], 201);
    } catch (error) {
      return c.json({ error: "Invalid token" }, 401);
    } finally {
      conn.release();
    }
  });

  app.post("/auth-register", async (c) => {
    const conn = await pool.getConnection();
    try {
      const { username, password } = await c.req.parseBody();
      const hashedpassword = bcrypt.hash(password, 10);

      conn.query("INSERT INTO users (username, password_hash) VALUES (?, ?)", [
        username,
        hashedpassword,
      ]);

      return c.json({ message: "User registered successfully" }, 201);
    } catch (error) {
      return c.json({ message: "Registration failed" }, 500);
    } finally {
      conn.release();
    }
  });

  app.post("/auth-login", async (c) => {
    const conn = await pool.getConnection();
    try {
      const { username, password } = await c.req.parseBody();
      const user = await conn.query(
        "SELECT * FROM users WHERE username=(?)",
        username,
      );
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
      return c.json({ error: "Login failed" }, 500);
    } finally {
      conn.release();
    }
  });
  // Routes for seen/unseen
  app.post("/get-seen", async (c) => {
    const conn = await pool.getConnection();
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Access denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const urls = await c.req.json();
      const placeholders = urls.map(() => "?").join(",");

      const seen = await conn.query(
        `SELECT episode_id, watch_playtime, watch_duration from watch_history
         WHERE user_id = ?
         AND episode_id IN (${placeholders})`,
        [(<any>decoded).userId, ...urls],
      );
      return c.json(seen, 200);
    } catch (error) {
      return c.json({ error: "Invalid token" }, 401);
    } finally {
      conn.release();
    }
  });

  interface Entry {
    playtime: Number;
    duration: Number;
    redirect: String;
  }

  app.post("/handle-seen", async (c) => {
    const conn = await pool.getConnection();
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");
      const data = await c.req.json();

      await conn.query(
        `
        INSERT INTO watch_history (user_id, episode_id, watch_playtime, watch_duration)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            watch_playtime = VALUES(watch_playtime),
            watch_duration = VALUES(watch_duration);`,
        [(<any>decoded).userId, data.id, data.playtime, data.duration],
      );

      return c.text("", 200);
    } catch (error) {
      return c.json({ error: "Invalid token" }, 401);
    } finally {
      conn.release();
    }
  });

  // routes for marked
  app.get("/get-list", async (c) => {
    const conn = await pool.getConnection();
    const token = c.req.header("Authorization");

    if (!token) return c.json({ error: "Access denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const marked = await conn.query(
        "SELECT series_id from user_watchlist WHERE user_id = ? AND is_in_list = 1",
        (<any>decoded).userId,
      );

      return c.json(marked, 200);
    } catch (error) {
      return c.json({ error: "Error" }, 401);
    } finally {
      conn.release();
    }
  });

  app.post("/get-marked", async (c) => {
    const conn = await pool.getConnection();
    const token = c.req.header("Authorization");

    if (!token) return c.json({ error: "Access denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const marked = await conn.query(
        "SELECT is_in_list from user_watchlist WHERE user_id = ? AND series_id = ?",
        [(<any>decoded).userId, await c.req.text()],
      );

      return c.json(marked, 200);
    } catch (error) {
      return c.json({ error: "Error" }, 401);
    } finally {
      conn.release();
    }
  });

  app.post("/handle-marked", async (c) => {
    const conn = await pool.getConnection();
    const token = c.req.header("Authorization");
    if (!token) return c.json({ error: "Acces denied" }, 401);
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      await conn.query(
        `
        INSERT INTO user_watchlist (user_id, series_id, is_in_list)
        VALUES (?, ?, true)
        ON DUPLICATE KEY UPDATE
            is_in_list = NOT is_in_list;`,
        [(<any>decoded).userId, await c.req.text()],
      );

      return c.text("", 200);
    } catch (error) {
      return c.json({ error: "Invalid token" }, 401);
    } finally {
      conn.release();
    }
  });

  app.post("/get-anime", async (c) => {
    const url = await c.req.text();

    if (url.length == 0) return c.text("", 500);

    const conn = await pool.getConnection();

    const anime = await conn.query(
      `
      SELECT * FROM anime WHERE url = (?);`,
      url,
    );

    conn.release();

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

    const conn = await pool.getConnection();

    await conn.query(
      `
      INSERT INTO anime (url, title, image) VALUES (?, ?, ?)`,
      [json.redirect, json.title, json.image],
    );

    conn.release();

    return c.text("", 200);
  });
}
