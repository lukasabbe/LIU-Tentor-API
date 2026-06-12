import csvParser from "csv-parser";
import fs from "fs";

type CourseEval = {
    title: string;
    date: string;
    courseCode: string;
    year: string;
    semester: string;
    questions: Question[];
};

type Question = {
    title: string;
    avgValue: number;
};

const DATA: CourseEval[] = [];

fs.createReadStream("./EvaliuateData.csv")
    .pipe(csvParser())
    .on("data", (row) => {
        const questions: Question[] = [];

        for (const key of Object.keys(row)) {
            if (
                key !== "Enkät" &&
                key !== "Enkätkategori" &&
                key !== "Enkätkategori.1" &&
                key !== "course_code"
            ) {
                const val = row[key];
                if (val !== undefined) {
                    const question: Question = {
                        title: key,
                        avgValue: parseFloat(val),
                    };
                    questions.push(question);
                }
            }
        }

        DATA.push({
            title: row["Enkät"] || "",
            date: row["Enkät"]?.match(/\d{4}-\d{2}-\d{2}/)?.[0] || "",
            courseCode: row["course_code"] || "",
            year: row["Enkätkategori"] || "",
            semester: row["Enkätkategori.1"] || "",
            questions,
        });
    });

export const formatedData = (courseCode: string): CourseEval[] => {
    return DATA.filter((item) => item.courseCode === courseCode);
};
