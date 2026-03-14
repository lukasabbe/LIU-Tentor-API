import fetch from "node-fetch";
import type { RequestInit } from "node-fetch";
import type { CourseStatistic } from "./types.js";

const textDecoder = new TextDecoder('utf-8');

/**
 * Returns all courses, Takes around 50s
 * @returns All liu courses
 */
export const fetchAllCourses = async(): Promise<string[] | null> => {
    const res = await fetch("https://api.liu.se/education/ExamStatistics/coursecodes", getBody());
    if(!res.ok) {
        return null;
    }
    const rawBuffer = await res.arrayBuffer()
    const rawText = textDecoder.decode(rawBuffer);
    return JSON.parse(rawText);
};


/**
 * Returns all statistics for the entered course 
 * @param courseCode course code
 * @returns course stats
 */
export const fetchCourseStatistics = async(courseCode: string): Promise<CourseStatistic[] | null> => {
    const res = await fetch(`https://api.liu.se/education/ExamStatistics/${courseCode}?limit=1000`, getBody());
    if(!res.ok) {
        return null;
    }
    const rawBuffer = await res.arrayBuffer();
    const rawText = textDecoder.decode(rawBuffer);
    return JSON.parse(rawText) as CourseStatistic[];
}

const getBody = (): RequestInit => {
    const options: RequestInit = {
        method: "GET",
        headers: {
            "LiU-Operation-Id": "exam-statistics",
            "Cache-Control": "no-cache",
            "LiU-Api-Version": "v1",
            "Accept": "application/json",
            "content-type": "application/json",
            "Ocp-Apim-Subscription-Key": process.env.LIU_API_KEY || ""
        }
    };
    return options;
}