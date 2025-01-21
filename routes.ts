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

      await conn.query("UPDATE users SET avatar_url = ? WHERE user_id = ?", [
        req.body,
        (<any>decoded).userId,
      ]);
      res.status(201).json({ message: "success" });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
  });

  app.get("/get-avatar", async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Acces denied" });
    try {
      const decoded = jwt.verify(token, "your-secret-key");

      const image = await conn.query(
        "Select avatar_url FROM users WHERE user_id = ?",
        (<any>decoded).userId,
      );
      res.status(201).send(image[0]);
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
  });

  // Routes for register, login
  app.get("/register", (req: Request, res: Response) => {
    res
      .status(200)
      .setHeader("Content-Type", "text/html")
      .send(
        fs.readFileSync(
          path.join(__dirname, "/public/register/index.html"),
          "utf8",
        ),
      );
  });

  app.get("/login", (req: Request, res: Response) => {
    res
      .status(200)
      .setHeader("Content-Type", "text/html")
      .send(
        fs.readFileSync(
          path.join(__dirname, "/public/login/index.html"),
          "utf8",
        ),
      );
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
}
