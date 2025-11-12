import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1) Static files (your index.html, audio/, etc.)
app.use(express.static(path.join(__dirname, "public")));

// 2) Parse JSON
app.use(express.json({ limit: "2mb" }));

// 3) PostgreSQL connection (Render sets DATABASE_URL)
// Local dev? set DATABASE_URL in your shell.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 30000,
    ssl: process.env.RENDER ? { rejectUnauthorized: false } : false
});


// 4) Submit endpoint
app.post("/submit", async (req, res) => {
    try {
        const { participantName, answers, order, submittedAt } = req.body;

        // Basic validation
        if (!participantName || typeof answers !== "object" || !Array.isArray(order)) {
            return res.status(400).json({ ok: false, error: "Bad payload" });
        }

        // Insert
        const q = `
      INSERT INTO responses (participant_name, answers, order_list, submitted_at)
      VALUES ($1, $2::jsonb, $3::text[], $4::timestamptz)
      RETURNING id
    `;
        const vals = [
            participantName.trim(),
            answers,
            order,
            submittedAt || new Date().toISOString()
        ];

        const result = await pool.query(q, vals);
        return res.json({ ok: true, id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
});


// 5) Fallback to index.html for root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
