export type Course = {
    course_code: string
    course_name_swe: string
    course_name_eng: string
    last_updated_timestamp: string
}

export type Module = {
    id: number
    module_code: string
    date: string
    course_code: string
}

export type Grade = {
    id: number
    grade: string
    grade_order: number
    quantity: number
    module_id: number
}

export type FormattedCourseData = {
    courseCode: string
    courseNameSwe: string
    courseNameEng: string
    lastUpdatedTimestamp: string
    modules: {
        moduleCode: string
        date: string
        grades: {
            grade: string
            gradeOrder: number
            quantity: number
        }[]
    }[]
}
