import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "static")));

app.post("/submit", (req, res) => {
    const data = req.body || {};
    const line = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        ip: req.ip
    }) + "\n";

    // append to local file
    fs.appendFile(path.join(__dirname, "responses.jsonl"), line, (err) => {
        if (err) {
            console.error("Error writing response:", err);
            return res.status(500).json({ ok: false });
        }
        return res.json({ ok: true });
    });
});

// basic health route
app.get("/health", (req, res) => {
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
