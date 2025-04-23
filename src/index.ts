import express from "express";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
import cors from "cors";
import sqlite3 from "sqlite3";
//@ts-ignore
import { expressAnalytics } from "node-api-analytics";
import { get_all, get_all_coruses, get_course_data, update_course_data } from "./utils.js";

dotenv.config();

const db = new sqlite3.Database("database.db")

db.serialize(async() => {
    db.run(`CREATE TABLE IF NOT EXISTS course (course_code TEXT PRIMARY KEY, course_name_swe TEXT, course_name_eng TEXT, last_updated_timestamp TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS module (id INTEGER PRIMARY KEY AUTOINCREMENT, module_code TEXT, date TEXT, course_code TEXT, FOREIGN KEY(course_code) REFERENCES course(course_code))`);
    db.run(`CREATE TABLE IF NOT EXISTS grade (id INTEGER PRIMARY KEY AUTOINCREMENT, grade TEXT, grade_order INTEGER, quantity INTEGER, module_id INTEGER, FOREIGN KEY(module_id) REFERENCES module(id))`);
    const rows = await get_all(`SELECT * FROM course`, [],db)
    const courses = rows as any[];
    if (courses.length === 0) {
        const data = await get_all_coruses();
        const stmt = db.prepare(`INSERT INTO course (course_code, last_updated_timestamp) VALUES (?, ?)`);
        data.forEach((course: any) => {
            stmt.run(course, -1);
        });
        stmt.finalize();
    }
})


const limiter = rateLimit({
    windowMs: 1000*60,
    max: 500, // Limit each IP to 500 requests per windowMs
    message: "Too many requests, please try again later.",
    standardHeaders: 'draft-8',
    legacyHeaders: false
});

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(limiter)
app.use(expressAnalytics(process.env.ANALYTICS_API_KEY));

app.get("/", (req, res) => {
  res.json({ service : "Online" });
});

app.get("/api/courses", (req, res) => {
    db.all(`SELECT * FROM course`, (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(row => {
                return (row as any).course_code;
            }));
        }
    })
})

app.get("/api/courses/:course_code", (req, res) => {
    if(!req.params.course_code) {
        res.status(400).json({ error: "Course code is required" });
        return;
    }
    db.get(`SELECT * FROM course WHERE course_code = ?`, [req.params.course_code.toUpperCase()], async (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            res.status(404).json({ error: "Course not found" });
            return;
        }

        const row_data = row as any;
        const course_code = row_data.course_code;
        const time_before_course_update = 1000 * 60 * 60 * 24; // 24 hours
        if(row_data.last_updated_timestamp === -1 || parseInt(row_data.last_updated_timestamp) + time_before_course_update < Date.now()) {
            if(!await update_course_data(course_code,db)){
                res.status(503).json({ error: "There is to many unique requests to LIU:s servers right now, so we are rate limited. Try this course later" });
                return;
            }
        }
        const data = await get_course_data(course_code,db);
        if (!data) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        res.json(data);
    })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
})
