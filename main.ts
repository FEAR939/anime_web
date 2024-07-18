import express, { Express, Request, Response } from "express";
import mariadb from "mariadb";
const app = express();
import * as fs from "fs";
import * as path from "path";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const PORT: number = 80;

const pool = mariadb.createPool({
    host: "",
    user: "",
    password: "",
    database: ""
});

pool.getConnection().then(conn => {
    // Routes for home page
    app.get("/", (req: Request, res: Response) => {
        res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/home/index.html"), "utf8"));
    });

    app.get("/public/home/styles.css", (req: Request, res: Response) => {
        res.status(200).setHeader("Content-Type", "text/css").send(fs.readFileSync(path.join(__dirname, "/public/home/styles.css"), "utf8"));
    });

    app.get("/public/home/script.js", (req: Request, res: Response) => {
        res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/home/script.js"), "utf8"));
    });

    // Routes for search page
    app.get("/search", (req: Request, res: Response) => {
        res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/search/index.html"), "utf8"));
    });

    app.get("/public/search/script.js", (req: Request, res: Response) => {
        res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/search/script.js"), "utf8"));
    });

    // Routes for watch page
    app.get("/watch", (req: Request, res: Response) => {
        res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/watch/index.html"), "utf8"));
    });

    app.get("/public/watch/script.js", (req: Request, res: Response) => {
        res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/watch/script.js"), "utf8"));
    });

    // Routes for Ressources
    app.get("/public/icons8-search.png", (req: Request, res: Response) => {
        const stream = fs.createReadStream(path.join(__dirname, "/public/icons8-search.png"));
        res.status(200).setHeader("Content-Type", "image/png");
        stream.pipe(res);
    });

    app.get("/public/icons8-star.png", (req: Request, res: Response) => {
        const stream = fs.createReadStream(path.join(__dirname, "/public/icons8-star.png"));
        res.status(200).setHeader("Content-Type", "image/png");
        stream.pipe(res);
    });

    app.get("/public/icons8-arrowleft.png", (req: Request, res: Response) => {
        const stream = fs.createReadStream(path.join(__dirname, "/public/icons8-arrowleft.png"));
        res.status(200).setHeader("Content-Type", "image/png");
        stream.pipe(res);
    });

    // Routes for cors-fetch
    app.post("/cors-fetch", (req: Request, res: Response) => {
        const request = req.body.split(" ");
        if (request[0] == "GET") {
            fetch(request[1]).then(response => response.text()).then(text => res.status(200).send(text));
        } else if (request[0] == "POST") {
            fetch(request[2], { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: request[1] }).then(response => response.text()).then(text => res.status(200).send(text));
        } else {
            res.status(404);
        }
    });

    // Routes for register, login
    app.get("/register", (req: Request, res: Response) => {
        res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/register/index.html"), "utf8"));
    });

    app.get("/login", (req: Request, res: Response) => {
        res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/login/index.html"), "utf8"));
    });

    app.post("/auth-register", async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            const hashedpassword = await bcrypt.hash(password, 10);

            conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedpassword]);
            res.status(201).json({ message: "User registered successfully" });
        } catch (error) {
            res.status(500).json({ message: "Registration failed" });
        }
    });

    app.post("/auth-login", async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            const user = await conn.query("SELECT * FROM users WHERE username=(?)", username);
            if (!user) {
                return res.status(401).json({ error: 'Authentication failed' });
            }
            const passwordMatch = await bcrypt.compare(password, user[0].password);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Authentication failed' });
            }
            const token = jwt.sign({ userId: user[0].id }, 'your-secret-key');
            res.status(200).json({ token });
        } catch (error) {
            res.status(500).json({ error: 'Login failed' });
        }
    });
    // Routes for seen/unseen
    app.get("/get-seen", async (req: Request, res: Response) => {
        const token = req.header("Authorization");
        if (!token) return res.status(401).json({ error: "Access denied" });
        try {
            const decoded = jwt.verify(token, 'your-secret-key');
            const seen = await conn.query("SELECT seen from users WHERE id=(?)", (<any>decoded).userId);
            res.status(200).send(seen[0]);
        } catch (error) {
            res.status(401).json({ error: "Invalid token" });
        }
    });

    app.post("/handle-seen", async (req: Request, res: Response) => {
        const token = req.header("Authorization");
        if (!token) return res.status(401).json({ error: "Acces denied" });
        try {
            const decoded = jwt.verify(token, 'your-secret-key');
            const query = await conn.query("SELECT seen FROM users WHERE id=(?)", (<any>decoded).userId);
            const seen: Array<String> = JSON.parse(query[0].seen);
            const index = seen.indexOf(req.body); 
            if (index !== -1) {
                seen.splice(index, 1);
            } else {
                seen.push(req.body.toString());
            }
            await conn.query("UPDATE users SET seen = ? WHERE id = ?", [JSON.stringify(seen), (<any>decoded).userId]);
            res.status(201).json({ action: index == -1 ? "added" : "removed" });
        } catch (error) {
            res.status(401).json({ error: "Invalid token" });
        }
    });

    app.listen(PORT, () => {
        console.log("Server running on Port: %s", PORT);
    });
});