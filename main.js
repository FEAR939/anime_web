"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mariadb_1 = __importDefault(require("mariadb"));
const app = (0, express_1.default)();
const routes_js_1 = __importDefault(require("./routes.js"));
app.use(express_1.default.json());
app.use(express_1.default.text({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
const PORT = 5000;
const pool = mariadb_1.default.createPool({
    host: "raspberrypi",
    user: "anime_web",
    password: "anime_web",
    database: "anime_web",
});
(0, routes_js_1.default)(app, pool);
var hourUtil = [];
function handleHourUtil(value, timestampHour, timestampMin) {
    const index = hourUtil.findIndex((minute) => {
        return (minute.timestampHour == timestampHour &&
            minute.timestampMin == timestampMin);
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
    if (hourUtil.length > 60)
        hourUtil.shift();
}
function hourInterval() {
    handleHourUtil(0, new Date().getHours(), new Date().getMinutes());
    const now = new Date();
    const later = new Date(now);
    later.setMinutes(later.getMinutes() + 1, 0, 0);
    const difference = later.getTime() - now.getTime();
    setTimeout(hourInterval, difference);
}
// Handler for logging requests and CORS Origin
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization");
    handleHourUtil(1, new Date().getHours(), new Date().getMinutes());
    next();
});
app.get("/dashboard/getHour", (req, res) => {
    res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .send(JSON.stringify(hourUtil));
});
app.listen(PORT, () => {
    console.log("Server running on Port: %s", PORT);
    hourInterval();
});
