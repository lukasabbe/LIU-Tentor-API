import express from 'express'
import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv'
import cors from 'cors'
import {
    get_all_cashed,
    get_course_data,
    get_formated_course_data,
    initializeDatabase,
    update_course_data
} from './database.js'
import { Course, FormattedCourseData } from './types.js'

dotenv.config()

const limiter = rateLimit({
    windowMs: 1000 * 60,
    max: 500, // Limit each IP to 500 requests per windowMs
    message: 'Too many requests, please try again later.',
    standardHeaders: 'draft-8',
    legacyHeaders: false
})

const app = express()

const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(limiter)

app.get('/', (req, res) => {
    res.json({ service: 'Online' })
})

app.get('/api/courses', async (req, res) => {
    res.json((await get_all_cashed())?.map((row) => (row as Course).course_code))
})

app.get('/api/courses/:course_code', async (req, res) => {
    let force = false

    if (req.query.force === 'true' && req.query.token === process.env.FORCE_UPDATE_TOKEN) {
        console.log('Force update for course ' + req.params.course_code)
        force = true
    }

    const course_data = await get_course_data(req.params.course_code)
    if (!course_data) {
        res.status(404).json({ error: 'Course not found' })
        return
    }

    const time_before_course_update = 1000 * 60 * 60 * 24 // 24 hours
    if (
        course_data.last_updated_timestamp === '-1' ||
        parseInt(course_data.last_updated_timestamp) + time_before_course_update < Date.now() ||
        force
    ) {
        if (!(await update_course_data(course_data.course_code))) {
            res.status(503).json({
                error: 'There is too many unique requests to LIU:s servers right now, so we are rate limited. Try this course later'
            })
            return
        }
    }

    res.json(await get_formated_course_data(req.params.course_code))
})


app.get('/api/courses/bulk/:course_codes', async (req, res) => {
    const raw = req.params.course_codes.trim()
    if (!raw) {
        res.status(400).json({ error: 'No course codes provided' })
        return
    }

    // Split, normalize, de-duplicate
    const course_codes = Array.from(
        new Set(
            raw.split(',').map(c => c.trim().toUpperCase()).filter(c => c.length > 0)
        )
    )

    if (course_codes.length === 0) {
        res.status(400).json({ error: 'No valid course codes provided' })
        return
    }

    if (course_codes.length > 5) {
        res.status(400).json({ error: 'Too many courses requested, maximum is 5' })
        return
    }

    // Fetch metadata
    const courseDataList = await Promise.all(course_codes.map(code => get_course_data(code)))

    if (courseDataList.some(c => !c)) {
        res.status(404).json({ error: 'One or more courses not found' })
        return
    }

    const time_before_course_update = 1000 * 60 * 60 * 24 // 24 hours
    const formatted: FormattedCourseData[] = []

    for (const course of courseDataList as Course[]) {
        if (
            course.last_updated_timestamp === '-1' ||
            parseInt(course.last_updated_timestamp) + time_before_course_update < Date.now()
        ) {
            if (!(await update_course_data(course.course_code))) {
                res.status(503).json({
                    error: 'There is too many unique requests to LIU:s servers right now, so we are rate limited. Try this course later'
                })
                return
            }
        }
        formatted.push(await get_formated_course_data(course.course_code) as FormattedCourseData)
    }

    res.json(formatted)
})


app.listen(PORT, () => {
    initializeDatabase()
    console.log(`Server is running on port ${PORT}`)
    console.log(`http://localhost:${PORT}`)
})
