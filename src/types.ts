export type CourseStatistic = {
    courseCode: string,
    moduleCode: string,
    courseTitle: LanguageContent,
    examtitle: LanguageContent,
    grades: Grade[],
    examinationDate: string
}

export type DataCourseStatistic = {
    courseCode: string,
    courseTitle: LanguageContent,
    lastUpdatedTimestamp: string,
    modules: Module[],
    evaluationReports: EvaliuateData[]
}

export type EvaliuateData = {
    reportId: number,
    reportDate: string,
    scores: Scores
}

type Scores = {
    1: number,
    2: number,
    3: number,
    4: number,
    5: number
}

type LanguageContent = {
    en: string,
    sv: string
}

type Grade = {
    grade: string,
    gradeOrder: number,
    quantity: number
}

type Module = {
    moduleCode: string,
    moduleTitle: LanguageContent
    date: string,
    grades: Grade[]
}