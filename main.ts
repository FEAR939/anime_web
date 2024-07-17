import express, { Express, Request, Response } from "express";
const app = express();
import * as fs from "fs";
import * as path from "path";

const PORT: number = 80;

app.use(express.text());

// Route for home page
app.get("/", (req: Request, res: Response) => {
    res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/home/index.html"), "utf8"));
});

app.get("/public/home/styles.css", (req: Request, res: Response) => {
    res.status(200).setHeader("Content-Type", "text/css").send(fs.readFileSync(path.join(__dirname, "/public/home/styles.css"), "utf8"));
});

app.get("/public/home/script.js", (req: Request, res: Response) => {
    res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/home/script.js"), "utf8"));
});

// Route for search page
app.get("/search", (req: Request, res: Response) => {
    res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/search/index.html"), "utf8"));
});

app.get("/public/search/script.js", (req: Request, res: Response) => {
    res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/search/script.js"), "utf8"));
});

// Route for watch page
app.get("/watch", (req: Request, res: Response) => {
    res.status(200).setHeader("Content-Type", "text/html").send(fs.readFileSync(path.join(__dirname, "/public/watch/index.html"), "utf8"));
});

app.get("/public/watch/script.js", (req: Request, res: Response) => {
    res.status(200).setHeader("Content-Type", "text/javascript").send(fs.readFileSync(path.join(__dirname, "/public/watch/script.js"), "utf8"));
});

// Route for Ressources
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

// Route for cors-fetch
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

app.listen(PORT, () => {
    console.log("Server running on Port: %s", PORT);
});