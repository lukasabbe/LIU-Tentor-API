import { Database } from "sqlite3";

export const get_course_data = async (course_code: string, db:Database) => {
    return new Promise(async (resolve) => {
        db.get(`SELECT * FROM course WHERE course_code = ?`, [course_code], async (err, row) => {
            if (err) {
                console.error(err.message);
                return resolve(null);
            }

            if (!row) {
                return resolve(null);
            }

            const row_data = row as any;
            
            const module_data = await get_all(`SELECT * FROM module WHERE course_code = ?`, [row_data.course_code], db) as any[];
            if (!module_data) {
                return resolve(null);
            }
            const module_ids = module_data.map((module) => module.id);
            const grades = await get_all(`SELECT * FROM grade WHERE module_id IN (${module_ids.map(() => "?").join(",")})`, module_ids, db) as any[];
            if (!grades) {
                return resolve(null);
            }
            const data = {
                courseCode : row_data.course_code,
                courseNameSwe : row_data.course_name_swe,
                courseNameEng : row_data.course_name_eng,
                lastUpdatedTimestamp : row_data.last_updated_timestamp,
                modules : module_data.map((module) => {
                    return {
                        moduleCode : module.module_code,
                        date : module.date,
                        grades : grades.filter((grade) => grade.module_id === module.id).map((grade) => {
                            return {
                                grade : grade.grade,
                                gradeOrder : grade.grade_order,
                                quantity : grade.quantity
                            }
                        })
                    }
                })
            }
            resolve(data);
        })
    })
}

export const get_all = async (sql_str:string, params:any[], db:Database) => {
    return new Promise((resolve) => {
        db.all(sql_str, params, (err, rows) => {
            if (err) {
                console.error(err.message);
                return resolve(null);
            }
            if (!rows) {
                return resolve(null);
            }
            resolve(rows);
        });
    })
}

export const run = async (d:any, sql_str:string, params:any[]) => {
    return new Promise((resolve) => {
        d.run(sql_str, params, (err:any) => {
            if (err) {
                console.error(err.message);
                return resolve(null);
            }
            resolve(null);
        });
    })
}

export const update_course_data = async (course_code: string, db:Database) => {
    console.log("fetching course data for " + course_code);
    return await new Promise(async (resolve) => {
        const data = await get_specific_course_data(course_code)

        if(data === null) {
            return resolve(false);
        }

        await run(db,`UPDATE course SET last_updated_timestamp = ?, course_name_swe = ?, course_name_eng = ? WHERE course_code = ?`, [Date.now(), data[0].courseTitle.sv, data[0].courseTitle.en, course_code])
        await run(db,`DELETE FROM module WHERE course_code = ?`, [course_code])

        for(const module of data) {
            await run(db, `INSERT INTO module (module_code, date, course_code) VALUES (?, ?, ?)`, [module.moduleCode, module.examinationDate, course_code])
            const module_id = await new Promise((resolve) => {
                db.get(`SELECT last_insert_rowid() as id`, (err, row) => {
                    if (err) {
                        console.error(err.message);
                        return resolve(null);
                    }
                    if (!row) {
                        return resolve(null);
                    }
                    resolve((row as any).id);
                })
            });
            for(const grade of module.grades) {
                await run(db, `INSERT INTO grade (grade, grade_order, quantity, module_id) VALUES (?, ?, ?, ?)`, [grade.grade, grade.gradeOrder, grade.quantity, module_id])
            }
        }

        resolve(true);
    })
}

export const get_all_coruses = async () => {
    console.log("Fetching all courses...");
    const response = await fetch('https://api.liu.se/education/ExamStatistics/coursecodes', {
        method: "GET",
        headers: {
            "LiU-Operation-Id": "exam-statistics",
            "Cache-Control": "no-cache",
            'LiU-Api-Version': 'v1',
            "Accept": "application/json",
            "content-type": "application/json",
            "Ocp-Apim-Subscription-Key": process.env.LIU_API_KEY || ""
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("Fetched all courses successfully.");
    const raw_buffer = await response.arrayBuffer();
    const raw_text = new TextDecoder("utf-8").decode(raw_buffer);
    return JSON.parse(raw_text)
}

export const get_specific_course_data = async (course_code: string) => {
    const res = await fetch(`https://api.liu.se/education/ExamStatistics/${course_code}?limit=1000`,
        {
            method: "GET",
            headers: {
                "LiU-Operation-Id": "exam-statistics",
                "Cache-Control": "no-cache",
                'LiU-Api-Version': 'v1',
                "Accept": "application/json",
                "content-type": "application/json",
                "Ocp-Apim-Subscription-Key": process.env.LIU_API_KEY || ""
            }
        }
    );
    if (!res.ok) {
        return null;
    }
    const raw_buffer = await res.arrayBuffer();
    const raw_text = new TextDecoder("utf-8").decode(raw_buffer);
    return JSON.parse(raw_text)
}