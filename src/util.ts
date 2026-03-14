import type { CourseStatistic, DataCourseStatistic, EvaliuateData } from "./types.js";

export const generateReturn = (data: CourseStatistic[], evaliuateData: EvaliuateData[] | undefined): DataCourseStatistic => {
    let coureData: DataCourseStatistic = {
        courseCode: data[0]!.courseCode,
        courseTitle: data[0]!.courseTitle,
        lastUpdatedTimestamp: Date.now().toString(),
        modules: [],
        evaluationReports: evaliuateData || []
    }
    for(const course of data) {
        coureData.modules.push(
            {
                moduleCode: course.moduleCode,
                moduleTitle: course.examtitle,
                date: course.examinationDate,
                grades: course.grades
            }
        )
    }
    return coureData;
}