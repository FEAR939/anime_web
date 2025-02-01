import path from "path";
import fs from "fs";
import mariadb from "mariadb";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { Express, Request, Response } from "express";

export default function (app: Express, pool: mariadb.Pool) {
  app.post("/avatar-upload", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Acces denied" });
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }

      // Generate unique filename
      const filename = Date.now() + "-" + req.files.file.name;
      const filepath = path.join(__dirname, `/public/${filename}`);

      // Save the file
      await fs.writeFile(filepath, req.files.file.data, (err) => {
        if (err) throw new Error(err);
      });

      await conn.query("UPDATE users SET avatar_url = ? WHERE user_id = ?", [
        filepath,
        (<any>decoded).userId,
      ]);
      res.status(200).json({ url: filepath });
    } catch (e) {
      res.status(500).send();
    }
    conn.release();
  });

  app.get("/get-user", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Acces denied" });
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const user = await conn.query(
        "Select username, avatar_url FROM users WHERE user_id = ?",
        (<any>decoded).userId,
      );
      res.status(201).send(user[0]);
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
  });

  app.post("/auth-register", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      const { username, password } = req.body;
      const hashedpassword = await bcrypt.hash(password, 10);

      conn.query("INSERT INTO users (username, password_hash) VALUES (?, ?)", [
        username,
        hashedpassword,
      ]);
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
    conn.release();
  });

  app.post("/auth-login", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      const { username, password } = req.body;
      const user = await conn.query(
        "SELECT * FROM users WHERE username=(?)",
        username,
      );
      if (!user) {
        return res.status(401).json({ error: "Authentication failed" });
      }
      const passwordMatch = await bcrypt.compare(
        password,
        user[0].password_hash,
      );
      if (!passwordMatch) {
        return res.status(401).json({ error: "Authentication failed" });
      }
      const token = jwt.sign({ userId: user[0].user_id }, "your-secret-key");
      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
    conn.release();
  });
  // Routes for seen/unseen
  app.post("/get-seen", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Access denied" });
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const urls = req.body;
      const placeholders = urls.map(() => "?").join(",");

      const seen = await conn.query(
        `SELECT episode_id, watch_playtime, watch_duration from watch_history
         WHERE user_id = ?
         AND episode_id IN (${placeholders})`,
        [(<any>decoded).userId, ...urls],
      );
      res.status(200).send(seen);
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
  });

  interface Entry {
    playtime: Number;
    duration: Number;
    redirect: String;
  }

  app.post("/handle-seen", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Acces denied" });
    try {
      const decoded = jwt.verify(token, "your-secret-key");
      const data = req.body;

      await conn.query(
        `
        INSERT INTO watch_history (user_id, episode_id, watch_playtime, watch_duration)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            watch_playtime = VALUES(watch_playtime),
            watch_duration = VALUES(watch_duration);`,
        [(<any>decoded).userId, data.id, data.playtime, data.duration],
      );

      res.status(200).send();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
  });

  // routes for marked
  app.get("/get-list", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    const token = req.header("Authorization");

    if (!token) return res.status(401).json({ error: "Access denied" });
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const marked = await conn.query(
        "SELECT series_id from user_watchlist WHERE user_id = ? AND is_in_list = 1",
        (<any>decoded).userId,
      );

      res.status(200).send(marked);
    } catch (error) {
      res.status(401).json({ error: "Error" });
    }
    conn.release();
  });

  app.post("/get-marked", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    const token = req.header("Authorization");

    if (!token) return res.status(401).json({ error: "Access denied" });
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const marked = await conn.query(
        "SELECT is_in_list from user_watchlist WHERE user_id = ? AND series_id = ?",
        [(<any>decoded).userId, req.body.toString()],
      );

      res.status(200).send(marked);
    } catch (error) {
      res.status(401).json({ error: "Error" });
    }
    conn.release();
  });

  app.post("/handle-marked", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Acces denied" });
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      await conn.query(
        `
        INSERT INTO user_watchlist (user_id, series_id, is_in_list)
        VALUES (?, ?, true)
        ON DUPLICATE KEY UPDATE
            is_in_list = NOT is_in_list;`,
        [(<any>decoded).userId, req.body.toString()],
      );

      res.status(200).send();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
  });

  app.post("/get-anime", async (req: Request, res: Response) => {
    const url = req.body;

    if (url.length == 0) return res.status(500);

    const conn = await pool.getConnection();

    const anime = await conn.query(
      `
      SELECT * FROM anime WHERE url = (?);`,
      url,
    );

    if (anime.length !== 0) {
      res.status(200).json(anime[0]);
    } else {
      res.status(404).send();
    }

    conn.release();
  });

  app.post("/set-anime", async (req: Request, res: Response) => {
    if (req.body.length == 0) return res.status(500).send();

    const json = JSON.parse(req.body);

    if (
      typeof json.redirect == "undefined" ||
      typeof json.title == "undefined" ||
      typeof json.image == "undefined"
    )
      return res.status(500).send();

    const conn = await pool.getConnection();

    await conn.query(
      `
      INSERT INTO anime (url, title, image) VALUES (?, ?, ?)`,
      [json.redirect, json.title, json.image],
    );

    res.status(200).send();

    conn.release();
  });
}
