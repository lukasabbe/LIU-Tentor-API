import express, { json } from "express"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit";
import { fetchAllCourses, fetchCourseStatistics } from "./LiuApi.js";
import type { DataCourseStatistic, EvaliuateData } from "./types.js";
import { generateReturn } from "./util.js";
import fs from "fs";
import csvParser from "csv-parser";
import cors from "cors";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express()

const cache = new Map<string, DataCourseStatistic | null>();
const evaliuateData = new Map<String, EvaliuateData[]>();
let toggled = false;

const limiter = rateLimit({
    windowMs: 1000 * 60, // 1min
    max: 500,
    message: "Too many requests, please try again later.",
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
});

app.use(json());
app.use(limiter);
app.use(cors())

app.get("/", (req, res) => {
    res.json({status:"Ok"})
})

app.get("/api/courses", async (req, res) => {
    if(!toggled) return res.status(500).json({status: "Wating for courses!"});

    return res.json(cache.keys().toArray())
});

app.get("/api/courses/:courseCode", async (req, res) =>{

    if(!toggled) return res.status(500).json({status: "Wating for courses!"});
    const courseCode = req.params.courseCode;

    let course = cache.get(courseCode);

    const timeBeforeCourseUpdate = 1000 * 60 * 60 * 24; // 24h

    if(!course || parseInt(course.lastUpdatedTimestamp) + timeBeforeCourseUpdate < Date.now()){
        const courseStats = await fetchCourseStatistics(courseCode);
        if(!courseStats) return res.json({status: "Somting went wrong when fetching data from liu!"})
        course = generateReturn(courseStats, evaliuateData.get(courseCode.toUpperCase()));
        cache.set(courseCode, course);
    }

    res.json(course);
});

app.listen(PORT, async () => {
    console.log("http://localhost:3000");

    fs.createReadStream("EvaliuateReport.csv")
        .pipe(csvParser())
        .on("data", (row) => {
            if(evaliuateData.has(row.course_code)){
                const data = evaliuateData.get(row.course_code)!;
                data.push({
                    reportId: row.report_id,
                    reportDate: row.report_date,
                    scores: {
                        1: row.score_1,
                        2: row.score_2,
                        3: row.score_3,
                        4: row.score_4,
                        5: row.score_5,
                    }
                })
                evaliuateData.set(row.course_code, data);
            }else {
                evaliuateData.set(row.course_code, [{
                    reportId: row.report_id,
                    reportDate: row.report_date,
                    scores: {
                        1: row.score_1,
                        2: row.score_2,
                        3: row.score_3,
                        4: row.score_4,
                        5: row.score_5,
                    }
                }])
            }
        })
        .on("end", ()=> {
            console.log('CSV file successfully processed');
        })

    console.log("Fetching courses!");
    const courses = await fetchAllCourses();

    if(!courses){
        console.log("Failed");
        return null
    }
    console.log("Fetched courses!");

    for(const course of courses){
        cache.set(course, null);
    }

    toggled = true;
})