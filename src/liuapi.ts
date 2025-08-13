export const fetch_all_courses = async (): Promise<string[]> => {
    console.log('Fetching all courses...')
    const response = await fetch('https://api.liu.se/education/ExamStatistics/coursecodes', {
        method: 'GET',
        headers: {
            'LiU-Operation-Id': 'exam-statistics',
            'Cache-Control': 'no-cache',
            'LiU-Api-Version': 'v1',
            Accept: 'application/json',
            'content-type': 'application/json',
            'Ocp-Apim-Subscription-Key': process.env.LIU_API_KEY || ''
        }
    })
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    console.log('Fetched all courses successfully.')
    const raw_buffer = await response.arrayBuffer()
    const raw_text = new TextDecoder('utf-8').decode(raw_buffer)
    return JSON.parse(raw_text)
}

export const fetch_course_statistics = async (course_code: string) => {
    const res = await fetch(`https://api.liu.se/education/ExamStatistics/${course_code}?limit=1000`, {
        method: 'GET',
        headers: {
            'LiU-Operation-Id': 'exam-statistics',
            'Cache-Control': 'no-cache',
            'LiU-Api-Version': 'v1',
            Accept: 'application/json',
            'content-type': 'application/json',
            'Ocp-Apim-Subscription-Key': process.env.LIU_API_KEY || ''
        }
    })
    if (!res.ok) {
        return null
    }
    const raw_buffer = await res.arrayBuffer()
    const raw_text = new TextDecoder('utf-8').decode(raw_buffer)
    return JSON.parse(raw_text)
}
