# LIU Exams API

Retrieve results for LiU exams and other assignments.

## Documentation

Rate limit: 500 requests per minute.

If there are too many unique requests, the upstream LiU API rate limit may be hit. This is expected; you should still be able to retrieve the course within about one minute.

All courses are cached for 24 hours from the time you first request them. This reduces the number of requests sent to LiU's servers.

All responses are JSON.

### GET https://liutentor.lukasabbe.com/api/courses/

Returns a list of all LiU course codes.

### Response:

```json
[
  "...",
  "tata24",
  "..."
]
```

### GET https://liutentor.lukasabbe.com/api/courses/:courseCode

Returns results for the specified course.

Example: https://liutentor.lukasabbe.com/api/courses/TDDE35

### Response:

```json
{
  "courseCode": "TDDE35",
  "courseNameSwe": "Storskaliga distribuerade system och nätverk",
  "courseNameEng": "Large-Scale Distributed Systems and Networks",
  "lastUpdatedTimestamp": "1744731431257.0",
  "modules": [
    "...",
    {
      "moduleCode": "TEN1",
      "date": "2025-03-24T00:00:00Z",
      "grades": [
        {
          "grade": "5",
          "gradeOrder": 1,
          "quantity": 2
        },
        {
          "grade": "4",
          "gradeOrder": 2,
          "quantity": 9
        },
        {
          "grade": "3",
          "gradeOrder": 3,
          "quantity": 6
        },
        {
          "grade": "U",
          "gradeOrder": 4,
          "quantity": 12
        }
      ]
    },
    "..."
  ]
}
```
