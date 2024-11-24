import express, { Express, NextFunction, Request, Response } from "express";
import mariadb from "mariadb";
const app = express();
import * as fs from "fs";
import * as path from "path";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

app.use(express.json());
app.use(express.text({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const PORT: number = 5000;

const pool = mariadb.createPool({
  host: "raspberrypi",
  user: "anime_web",
  password: "anime_web",
  database: "anime_web",
});

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

// Routes for home page
app.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/html")
    .send(
      fs.readFileSync(path.join(__dirname, "/public/home/index.html"), "utf8"),
    );
});

app.get("/public/manifest.json", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "application/json")
    .send(
      fs.readFileSync(path.join(__dirname, "/public/manifest.json"), "utf8"),
    );
});

app.get("/public/home/styles.css", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/css")
    .send(
      fs.readFileSync(path.join(__dirname, "/public/home/styles.css"), "utf8"),
    );
});

app.get("/public/home/script.js", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/javascript")
    .send(
      fs.readFileSync(path.join(__dirname, "/public/home/script.js"), "utf8"),
    );
});

// Routes for search page
app.get("/search", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/html")
    .send(
      fs.readFileSync(
        path.join(__dirname, "/public/search/index.html"),
        "utf8",
      ),
    );
});

app.get("/public/search/script.js", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/javascript")
    .send(
      fs.readFileSync(path.join(__dirname, "/public/search/script.js"), "utf8"),
    );
});

// Routes for watch page
app.get("/watch", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/html")
    .send(
      fs.readFileSync(path.join(__dirname, "/public/watch/index.html"), "utf8"),
    );
});

app.get("/public/watch/script.js", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/javascript")
    .send(
      fs.readFileSync(path.join(__dirname, "/public/watch/script.js"), "utf8"),
    );
});
// Routes for avatar page
app.get("/avatar", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/html")
    .send(
      fs.readFileSync(
        path.join(__dirname, "/public/avatar/index.html"),
        "utf-8",
      ),
    );
});
app.get("/public/avatar/script.js", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/javascript")
    .send(
      fs.readFileSync(
        path.join(__dirname, "/public/avatar/script.js"),
        "utf-8",
      ),
    );
});
app.post("/avatar-upload", async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Acces denied" });
  try {
    const decoded = jwt.verify(token, "your-secret-key");

    await conn.query("UPDATE users SET avatar = ? WHERE id = ?", [
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
      "Select avatar FROM users WHERE id = ?",
      (<any>decoded).userId,
    );
    res.status(201).send(image[0]);
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
  conn.release();
});

// Routes for watchlist page
app.get("/watchlist", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/html")
    .send(
      fs.readFileSync(
        path.join(__dirname, "/public/watchlist/index.html"),
        "utf8",
      ),
    );
});

app.get("/public/watchlist/script.js", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/javascript")
    .send(
      fs.readFileSync(
        path.join(__dirname, "/public/watchlist/script.js"),
        "utf8",
      ),
    );
});

// Routes for Dashboard
app.get("/dashboard", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/html")
    .send(
      fs.readFileSync(
        path.join(__dirname, "/public/dashboard/index.html"),
        "utf8",
      ),
    );
});

app.get("/public/dashboard/script.js", (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/javascript")
    .send(
      fs.readFileSync(
        path.join(__dirname, "/public/dashboard/script.js"),
        "utf8",
      ),
    );
});

// Routes for Ressources
app.get("/public/icon.png", (req: Request, res: Response) => {
  const stream = fs.createReadStream(path.join(__dirname, "/public/icon.png"));
  res.status(200).setHeader("Content-Type", "image/png");
  stream.pipe(res);
});

app.get("/public/icons8-search.png", (req: Request, res: Response) => {
  const stream = fs.createReadStream(
    path.join(__dirname, "/public/icons8-search.png"),
  );
  res.status(200).setHeader("Content-Type", "image/png");
  stream.pipe(res);
});

app.get("/public/icons8-star.png", (req: Request, res: Response) => {
  const stream = fs.createReadStream(
    path.join(__dirname, "/public/icons8-star.png"),
  );
  res.status(200).setHeader("Content-Type", "image/png");
  stream.pipe(res);
});

app.get("/public/icons8-arrowleft.png", (req: Request, res: Response) => {
  const stream = fs.createReadStream(
    path.join(__dirname, "/public/icons8-arrowleft.png"),
  );
  res.status(200).setHeader("Content-Type", "image/png");
  stream.pipe(res);
});

app.get("/public/icons8-bookmark-filled.png", (req: Request, res: Response) => {
  const stream = fs.createReadStream(
    path.join(__dirname, "/public/icons8-bookmark-filled.png"),
  );
  res.status(200).setHeader("Content-Type", "image/png");
  stream.pipe(res);
});

app.get(
  "/public/icons8-bookmark-outlined.png",
  (req: Request, res: Response) => {
    const stream = fs.createReadStream(
      path.join(__dirname, "/public/icons8-bookmark-outlined.png"),
    );
    res.status(200).setHeader("Content-Type", "image/png");
    stream.pipe(res);
  },
);

app.get("/public/icons8-done.png", (req: Request, res: Response) => {
  const stream = fs.createReadStream(
    path.join(__dirname, "/public/icons8-done.png"),
  );
  res.status(200).setHeader("Content-Type", "image/png");
  stream.pipe(res);
});

app.get("/public/icons8-plus-math.png", (req: Request, res: Response) => {
  const stream = fs.createReadStream(
    path.join(__dirname, "/public/icons8-plus-math.png"),
  );
  res.status(200).setHeader("Content-Type", "image/png");
  stream.pipe(res);
});

app.get("/public/icons8-home.png", (req: Request, res: Response) => {
  const stream = fs.createReadStream(
    path.join(__dirname, "/public/icons8-home.png"),
  );
  res.status(200).setHeader("Content-Type", "image/png");
  stream.pipe(res);
});

// Routes for cors-fetch
app.post("/cors-fetch", (req: Request, res: Response) => {
  const request = req.body.split(" ");
  if (request[0] == "GET") {
    fetch(request[1])
      .then((response) => response.text())
      .then((text) => res.status(200).send(text));
  } else if (request[0] == "POST") {
    fetch(request[2], {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: request[1],
    })
      .then((response) => response.text())
      .then((text) => res.status(200).send(text));
  } else {
    res.status(404);
  }
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
      fs.readFileSync(path.join(__dirname, "/public/login/index.html"), "utf8"),
    );
});

app.post("/auth-register", async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  try {
    const { username, password } = req.body;
    const hashedpassword = await bcrypt.hash(password, 10);

    conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [
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
    const passwordMatch = await bcrypt.compare(password, user[0].password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const token = jwt.sign({ userId: user[0].id }, "your-secret-key");
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
  conn.release();
});
// Routes for seen/unseen
app.get("/get-seen", async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const decoded = jwt.verify(token, "your-secret-key");
    const seen = await conn.query(
      "SELECT seen from users WHERE id=(?)",
      (<any>decoded).userId,
    );
    res.status(200).send(seen[0]);
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
    const query = await conn.query(
      "SELECT seen FROM users WHERE id=(?)",
      (<any>decoded).userId,
    );
    const seen: Array<Entry> = JSON.parse(query[0].seen);
    const body: Entry = JSON.parse(req.body);

    const index = seen.findIndex((a) => a.redirect === body.redirect);
    if (index !== -1) {
      seen[index].playtime = body.playtime;
      seen[index].duration = body.duration;
    } else {
      seen.push(body);
    }
    await conn.query("UPDATE users SET seen = ? WHERE id = ?", [
      JSON.stringify(seen),
      (<any>decoded).userId,
    ]);
    res.status(201).json({ action: index == -1 ? "added" : "removed" });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
  conn.release();
});

// routes for marked
app.get("/get-marked", async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const decoded = jwt.verify(token, "your-secret-key");
    const marked = await conn.query(
      "SELECT marked from users WHERE id=(?)",
      (<any>decoded).userId,
    );
    res.status(200).send(marked[0]);
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
  conn.release();
});

app.post("/handle-marked", async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Acces denied" });
  try {
    const decoded = jwt.verify(token, "your-secret-key");
    const query = await conn.query(
      "SELECT marked FROM users WHERE id=(?)",
      (<any>decoded).userId,
    );
    const marked: Array<String> = JSON.parse(query[0].marked);
    const index = marked.indexOf(req.body);
    if (index !== -1) {
      marked.splice(index, 1);
    } else {
      marked.push(req.body.toString());
    }
    await conn.query("UPDATE users SET marked = ? WHERE id = ?", [
      JSON.stringify(marked),
      (<any>decoded).userId,
    ]);
    res.status(201).json({ action: index == -1 ? "added" : "removed" });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
  conn.release();
});

app.listen(PORT, () => {
  console.log("Server running on Port: %s", PORT);
  hourInterval();
});
