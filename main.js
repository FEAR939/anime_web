"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mariadb_1 = __importDefault(require("mariadb"));
const app = (0, express_1.default)();
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jwt = __importStar(require("jsonwebtoken"));
const bcrypt = __importStar(require("bcryptjs"));
app.use(express_1.default.json());
app.use(express_1.default.text({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
const PORT = 80;
const pool = mariadb_1.default.createPool({
    host: "raspberrypi",
    user: "anime_web",
    password: "anime_web",
    database: "anime_web"
});
// Routes for home page
app.get("/", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/home/index.html"), "utf8"));
});
app.get("/public/home/styles.css", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/css").send(fs.readFileSync(path.join(__dirname, "/public/home/styles.css"), "utf8"));
});
app.get("/public/home/script.js", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/home/script.js"), "utf8"));
});
// Routes for search page
app.get("/search", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/search/index.html"), "utf8"));
});
app.get("/public/search/script.js", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/search/script.js"), "utf8"));
});
// Routes for watch page
app.get("/watch", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/watch/index.html"), "utf8"));
});
app.get("/public/watch/script.js", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/watch/script.js"), "utf8"));
});
// Routes for avatar page
app.get("/avatar", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/avatar/index.html"), "utf-8"));
});
app.get("/public/avatar/script.js", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/avatar/script.js"), "utf-8"));
});
app.post("/avatar-upload", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield pool.getConnection();
    const token = req.header("Authorization");
    if (!token)
        return res.status(401).json({ error: "Acces denied" });
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        yield conn.query("UPDATE users SET avatar = ? WHERE id = ?", [req.body, decoded.userId]);
        res.status(201).json({ message: "success" });
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
}));
app.get("/get-avatar", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield pool.getConnection();
    const token = req.header("Authorization");
    if (!token)
        return res.status(401).json({ error: "Acces denied" });
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        const image = yield conn.query("Select avatar FROM users WHERE id = ?", decoded.userId);
        res.status(201).send(image[0]);
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
}));
// Routes for Ressources
app.get("/public/icons8-search.png", (req, res) => {
    const stream = fs.createReadStream(path.join(__dirname, "/public/icons8-search.png"));
    res.status(200).setHeader("Content-Type", "image/png");
    stream.pipe(res);
});
app.get("/public/icons8-star.png", (req, res) => {
    const stream = fs.createReadStream(path.join(__dirname, "/public/icons8-star.png"));
    res.status(200).setHeader("Content-Type", "image/png");
    stream.pipe(res);
});
app.get("/public/icons8-arrowleft.png", (req, res) => {
    const stream = fs.createReadStream(path.join(__dirname, "/public/icons8-arrowleft.png"));
    res.status(200).setHeader("Content-Type", "image/png");
    stream.pipe(res);
});
// Routes for cors-fetch
app.post("/cors-fetch", (req, res) => {
    const request = req.body.split(" ");
    if (request[0] == "GET") {
        fetch(request[1]).then(response => response.text()).then(text => res.status(200).send(text));
    }
    else if (request[0] == "POST") {
        fetch(request[2], { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: request[1] }).then(response => response.text()).then(text => res.status(200).send(text));
    }
    else {
        res.status(404);
    }
});
// Routes for register, login
app.get("/register", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/register/index.html"), "utf8"));
});
app.get("/login", (req, res) => {
    res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/login/index.html"), "utf8"));
});
app.post("/auth-register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield pool.getConnection();
    try {
        const { username, password } = req.body;
        const hashedpassword = yield bcrypt.hash(password, 10);
        conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedpassword]);
        res.status(201).json({ message: "User registered successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Registration failed" });
    }
    conn.release();
}));
app.post("/auth-login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield pool.getConnection();
    try {
        const { username, password } = req.body;
        const user = yield conn.query("SELECT * FROM users WHERE username=(?)", username);
        if (!user) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
        const passwordMatch = yield bcrypt.compare(password, user[0].password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
        const token = jwt.sign({ userId: user[0].id }, 'your-secret-key');
        res.status(200).json({ token });
    }
    catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
    conn.release();
}));
// Routes for seen/unseen
app.get("/get-seen", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield pool.getConnection();
    const token = req.header("Authorization");
    if (!token)
        return res.status(401).json({ error: "Access denied" });
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        const seen = yield conn.query("SELECT seen from users WHERE id=(?)", decoded.userId);
        res.status(200).send(seen[0]);
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
}));
app.post("/handle-seen", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield pool.getConnection();
    const token = req.header("Authorization");
    if (!token)
        return res.status(401).json({ error: "Acces denied" });
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        const query = yield conn.query("SELECT seen FROM users WHERE id=(?)", decoded.userId);
        const seen = JSON.parse(query[0].seen);
        const index = seen.indexOf(req.body);
        if (index !== -1) {
            seen.splice(index, 1);
        }
        else {
            seen.push(req.body.toString());
        }
        yield conn.query("UPDATE users SET seen = ? WHERE id = ?", [JSON.stringify(seen), decoded.userId]);
        res.status(201).json({ action: index == -1 ? "added" : "removed" });
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
    conn.release();
}));
app.listen(PORT, () => {
    console.log("Server running on Port: %s", PORT);
});
