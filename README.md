# LIU Tentor API

Skaffa alla resultat för LIU tentor igenom api:n

## Docs

### https://liutentor.lukasabbe.com/api/courses/ - GET request

Hämta alla kurser

### Response :

```json
[
    ...,
    "tata24",
    ...
]
```

### https://liutentor.lukasabbe.com/api/courses/:courseCode - GET

Skaffa data för en specifik kurs. Kommer innehålla resultat

### Response :

Exempel: https://liutentor.lukasabbe.com/api/courses/TDDE35

```json
{
  "courseCode": "TDDE35",
  "courseNameSwe": "Storskaliga distribuerade system och nätverk",
  "courseNameEng": "Large-Scale Distributed Systems and Networks",
  "lastUpdatedTimestamp": "1744731431257.0",
  "modules": [
    ...,
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
    ...,
  ]
}
```