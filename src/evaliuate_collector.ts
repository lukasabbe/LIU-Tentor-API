import dotenv from 'dotenv';
import fs from 'fs';
import { add_evaliuate_report_score, get_all_cashed, initializeDatabase } from './database.js';
import { PDFExtract } from 'pdf.js-extract';
dotenv.config();

type EvaliuateCourseData = {
    coursecode: string;
    titleSv: string;
    titleEn: string;
    programCode: string;
    semesterNameEn: string;
    srReportID: number;
    surveyPublishDate: string;
    surveyCloseDate: string;
    location: string;
    vfu: boolean;
    srFreetextReportID: number;
}

const question = "Vilket helhetsbetyg ger du kursen?";

(async () => {
    async function searchCourse(courseCode: string) {
        const url = 'https://admin.evaliuate.liu.se/api/Search/search';
        
        if (!process.env.LIU_COOKIE) {
            console.error("Missing LIU_COOKIE environment variable.");
            return;
        }

        const headers = {
            'Accept': 'text/plain',
            'Content-Type': 'application/json',
            'Origin': 'https://admin.evaliuate.liu.se',
            'Referer': 'https://admin.evaliuate.liu.se/search?lang=sv',
            'liu-auth-no-redirect': 'true',
            // Keeping a standard User-Agent just in case their firewall blocks default Node fetch agents
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', 
            'Cookie': process.env.LIU_COOKIE 
        };

        const body = JSON.stringify({
            coursecode: courseCode
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json() as EvaliuateCourseData[];
            return data;
            
        } catch (error) {
            console.error('Failed to fetch course data:', error);
        }
    }

    async function downloadReport(courseCode: string, reportID: number, reportDate: string) {
        const url = `https://admin.evaliuate.liu.se/ReportFile/report/${reportID}`;
        
        // Ensure the environment variable is set
        if (!process.env.LIU_COOKIE) {
            console.error("Missing LIU_COOKIE environment variable.");
            return;
        }

        const headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://admin.evaliuate.liu.se/search?lang=sv',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0', 
            'Cookie': process.env.LIU_COOKIE 
        };

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const pdfExtrator = new PDFExtract();
            const pdfData = await pdfExtrator.extractBuffer(buffer);
            if (!pdfData || !pdfData.pages || pdfData.pages.length === 0) {
                throw new Error('Failed to extract text from PDF');
            }

            const fileName = `${courseCode}_report_${reportID}.json`; 
            const filePath = `./data/${courseCode}/${fileName}`
            
            const courseScore: Record<1 | 2 | 3 | 4 | 5, number> = {
                5: 0,
                4: 0,
                3: 0,
                2: 0,
                1: 0
            };

            for (const page of pdfData.pages) {
                const questionItem = page.content.find(item => item.str.includes(question));
                if (!questionItem) continue;

                const yStart = questionItem.y;
                const yEnd = yStart + 80;
                const lineItems = page.content.filter(item => item.y > yStart && item.y < yEnd);

                const valueItems = lineItems.filter(item => {
                    return item.x >= 200 && /\d+\s*\(\d+%/.test(item.str);
                });

                for (const item of lineItems) {
                    if (item.x >= 150 || item.str.includes("(")) continue;
                    const match = item.str.trim().match(/^([1-5])\b/);
                    if (!match) continue;

                    const rating = parseInt(match[1], 10) as 1 | 2 | 3 | 4 | 5;
                    const valueItem = valueItems
                        .filter(value => Math.abs(value.y - item.y) < 0.6)
                        .sort((a, b) => Math.abs(a.y - item.y) - Math.abs(b.y - item.y))[0];

                    if (!valueItem) continue;
                    const value = parseInt(valueItem.str.split("(")[0].trim(), 10);
                    if (!Number.isNaN(value)) {
                        courseScore[rating] = value;
                    }
                }

                break;
            }

            // Write the extracted PDF data to a JSON file
            //fs.writeFileSync(`./data/${courseCode}/${courseCode}_report_${reportID}_score.json`, JSON.stringify(courseScore, null, 4));
            //fs.writeFileSync(`./data/${courseCode}/${courseCode}_report_${reportID}.json`, JSON.stringify(pdfData, null, 4));
            await add_evaliuate_report_score(courseCode, reportID, reportDate, courseScore);
            console.log(`Successfully saved report to: ${filePath}`);
            
        } catch (error) {
            console.error('Failed to download the report:', error);
        }
        }

    async function wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const courses = await get_all_cashed();
    if (!courses) return;

    initializeDatabase();

    for (const course of courses) {
        const data = await searchCourse(course.course_code);
        if (!data) continue;
        fs.mkdirSync(`./data/${course.course_code}`, { recursive: true });
        fs.writeFileSync(`./data/${course.course_code}/${course.course_code}.json`, JSON.stringify(data, null, 2));
        for (const item of data) {
            await downloadReport(course.course_code, item.srReportID, item.surveyPublishDate);
            await wait(100); // Wait for 1 second between requests to avoid overwhelming the server
        }
    }

})();


