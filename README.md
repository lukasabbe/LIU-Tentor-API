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
  "courseTitle": {
    "sv": "Storskaliga distribuerade system och nätverk",
    "en": "Large-Scale Distributed Systems and Networks"
  },
  "lastUpdatedTimestamp": "1744731431257.0",
  "modules": [
    "...",
    {
      "moduleCode": "TEN1",
      "moduleTitle": {
        "en": "Written examination",
        "sv": "Skriftlig tentamen"
      },
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
  ],
  "evaluationReports": [
    "...",
    {
        "reportId": "51887",
        "reportDate": "2025-05-19T00:00:00",
        "scores": [
            1: "1",
            2: "0",
            3: "0",
            4: "2",
            5: "0"
        ]
    }
    "..."
  ]
}
```

### GET https://liutentor.lukasabbe.com/api/evaluate/:courseCode

Returns evaliuate data results for the specified course.

Example: https://liutentor.lukasabbe.com/api/evaluate/TDDE35

### Response:

```json
[
    "...",
    {
        "title":"Large-Scale Distributed Systems and Networks (TDDE35 2020-06-01 Lin 988846)",
        "date":"2020-06-01",
        "courseCode":"TDDE35",
        "year":"2020",
        "semester":"VT",
        "questions":[
            {"title":"Kursens ämnesinnehåll har gett mig möjlighet att uppnå kursens lärandemål.","avgValue":4},
            {"title":"Kursens olika undervisnings- och arbetsformer har varit relevanta i relation till kursens lärandemål. Till undervisnings- och arbetsformer räknas till exempel föreläsningar, seminarier, laborationer, basgrupper, handledning, projekt och lektioner.","avgValue":3.57},
            {"title":"Kursens examinerande moment har varit relevanta i relation till kursens lärandemål.","avgValue":3.83},
            {"title":"Kursens pedagogiska genomförande har varit till stöd för mitt lärande.","avgValue":2.71},
            {"title":"Anser du att kursens innehåll, genomförande och examination stämmer med kursplanen?","avgValue":3.8},
            {"title":"Vilket helhetsbetyg ger du kursen?","avgValue":3}
        ]
    }
    "...",
]
```
