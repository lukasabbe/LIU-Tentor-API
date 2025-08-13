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
import { Course } from './types.js'

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
        if (!(await update_course_data(req.params.course_code))) {
            res.status(503).json({
                error: 'There is too many unique requests to LIU:s servers right now, so we are rate limited. Try this course later'
            })
            return
        }
    }

    res.json(await get_formated_course_data(req.params.course_code))
})

app.listen(PORT, () => {
    initializeDatabase()
    console.log(`Server is running on port ${PORT}`)
    console.log(`http://localhost:${PORT}`)
})
