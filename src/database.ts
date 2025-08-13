import sqlite3 from 'sqlite3'
import { fetch_all_courses, fetch_course_statistics } from './liuapi.js'
import { Course, FormattedCourseData, Grade, Module } from './types.js'

const db = new sqlite3.Database('database.db')

export const initializeDatabase = () => {
    db.serialize(async () => {
        db.run(
            `CREATE TABLE IF NOT EXISTS course (course_code TEXT PRIMARY KEY, course_name_swe TEXT, course_name_eng TEXT, last_updated_timestamp TEXT)`
        )
        db.run(
            `CREATE TABLE IF NOT EXISTS module (id INTEGER PRIMARY KEY AUTOINCREMENT, module_code TEXT, date TEXT, course_code TEXT, FOREIGN KEY(course_code) REFERENCES course(course_code))`
        )
        db.run(
            `CREATE TABLE IF NOT EXISTS grade (id INTEGER PRIMARY KEY AUTOINCREMENT, grade TEXT, grade_order INTEGER, quantity INTEGER, module_id INTEGER, FOREIGN KEY(module_id) REFERENCES module(id))`
        )
        const rows = await get_all_cashed()
        const courses = rows as Course[]
        if (courses.length === 0) {
            const data = await fetch_all_courses()
            const stmt = db.prepare(`INSERT INTO course (course_code, last_updated_timestamp) VALUES (?, ?)`)
            data.forEach((course) => {
                stmt.run(course, -1)
            })
            stmt.finalize()
        }
    })
}

export const get_all_cashed = async (): Promise<Course[] | null> => {
    return new Promise((resolve) => {
        db.all(`SELECT * FROM course`, [], (err, rows) => {
            if (err) {
                console.error(err.message)
                return resolve(null)
            }
            if (!rows) {
                return resolve(null)
            }
            resolve(rows as Course[])
        })
    })
}

export const get_course_data = async (course_code: string): Promise<Course | null> => {
    return new Promise((resolve) => {
        db.get(`SELECT * FROM course WHERE course_code = ?`, [course_code.toUpperCase()], (err, row) => {
            if (err) {
                console.error(err.message)
                return resolve(null)
            }
            if (!row) {
                return resolve(null)
            }
            resolve(row as Course)
        })
    })
}

export const get_module_data = async (course_code: string): Promise<Module[] | null> => {
    return new Promise((resolve) => {
        db.all(`SELECT * FROM module WHERE course_code = ?`, [course_code.toUpperCase()], (err, rows) => {
            if (err) {
                console.error(err.message)
                return resolve(null)
            }
            if (!rows) {
                return resolve(null)
            }
            resolve(rows as Module[])
        })
    })
}

export const get_grade_data = async (module_id: number): Promise<Grade[] | null> => {
    return new Promise((resolve) => {
        db.all(`SELECT * FROM grade WHERE module_id = ?`, [module_id], (err, rows) => {
            if (err) {
                console.error(err.message)
                return resolve(null)
            }
            if (!rows) {
                return resolve(null)
            }
            resolve(rows as Grade[])
        })
    })
}

export const get_formated_course_data = async (course_code: string): Promise<FormattedCourseData | null> => {
    const course_data = await get_course_data(course_code)
    if (!course_data) return null

    const module_data = await get_module_data(course_code)
    if (!module_data) return null

    const grade_data = await Promise.all(
        module_data.map(async (module) => {
            const grades = await get_grade_data(module.id)
            if (!grades) return null
            return {
                moduleCode: module.module_code,
                date: module.date,
                grades: grades.map((grade) => ({
                    grade: grade.grade,
                    gradeOrder: grade.grade_order,
                    quantity: grade.quantity
                }))
            }
        })
    )
    return {
        courseCode: course_data.course_code,
        courseNameSwe: course_data.course_name_swe,
        courseNameEng: course_data.course_name_eng,
        lastUpdatedTimestamp: course_data.last_updated_timestamp,
        modules: grade_data.filter((module) => module !== null) // Filter out any null modules
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const run = (sql: string, params: any[] = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error(err.message)
                return reject(err)
            }
            resolve(this)
        })
    })
}

export const update_course_data = async (course_code: string) => {
    const data = await fetch_course_statistics(course_code)

    if (data === null) {
        return false
    }
    await run(
        `UPDATE course SET last_updated_timestamp = ?, course_name_swe = ?, course_name_eng = ? WHERE course_code = ?`,
        [Date.now(), data[0].courseTitle.sv, data[0].courseTitle.en, course_code.toUpperCase()]
    )
    await run(`DELETE FROM module WHERE course_code = ?`, [course_code])

    for (const module of data) {
        await run(`INSERT INTO module (module_code, date, course_code) VALUES (?, ?, ?)`, [
            module.moduleCode,
            module.examinationDate,
            course_code.toUpperCase()
        ])
        const module_id = await new Promise((resolve) => {
            db.get(`SELECT last_insert_rowid() as id`, (err, row) => {
                if (err) {
                    console.error(err.message)
                    return resolve(null)
                }
                if (!row) {
                    return resolve(null)
                }
                resolve((row as Module).id)
            })
        })
        for (const grade of module.grades) {
            await run(`INSERT INTO grade (grade, grade_order, quantity, module_id) VALUES (?, ?, ?, ?)`, [
                grade.grade,
                grade.gradeOrder,
                grade.quantity,
                module_id
            ])
        }
    }

    return true
}
