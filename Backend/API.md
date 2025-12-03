# API document
## POST student signup /user/signup
request
```json
{
  "type":"student",//or "educator"
  "username":"name",
  "password":"password"
}
```
response with status code 200
```json
{ "user_id": 1}
```
response with status code 401
```json
{ "error": "Username already exists"}
```
repsosne with stataus code 400
```json
{ "error": "Invalid username or password"}
```

## POST login /user/login
request
```json
{
  "username":"name",
  "password":"password"
}
```
response with status code 200
```json
{ "login": true } //or false for wrong password
```

response with status code 401
```json
{ "error": "Username does not exist"}

## GET Game API /games/:id
All data for one game will be send at once. The frontend will divide the data into different component for each apge
```json
{
  "gameId": 1,
  "gameTitle": "Title",
  "gameDescription": "The background of the game..",
  "scenarioNum": 2,
  "createdBy": 1,
  "personas": [//List of personas (dict)
    {
      "personaId": 1,
      "personaAvatar": " ",//filepath
      "personaName": "Jerry",
      "personaRole": "Progject Manager",
      "personaProfile": "Project Profile",
      "personaTraits": "Behaviour...",
      "personaAttitude": "Attitude",
      "personaMotivation": ""
    },
    {
      "personaId": 2,
      "personaAvatar": " ",//filepath
      "personaName": "Jerry",
      "personaRole": "Progject Manager",
      "personaProfile": "Project Profile",
      "personaTraits": "Behaviour...",
      "personaAttitude": "Attitude",
      "personaMotivation": ""
    },{
      "personaId": 3,
      "personaAvatar": " ",//filepath
      "personaName": "Jerry",
      "personaRole": "Progject Manager",
      "personaProfile": "Project Profile",
      "personaTraits": "Behaviour...",
      "personaAttitude": "Attitude",
      "personaMotivation": ""
    },{
      "personaId": 4,
      "personaAvatar": " ",//filepath
      "personaName": "Jerry",
      "personaRole": "Progject Manager",
      "personaProfile": "Project Profile",
      "personaTraits": "Behaviour...",
      "personaAttitude": "Attitude",
      "personaMotivation": ""
    },{
      "personaId": 5,
      "personaAvatar": " ",//filepath
      "personaName": "Jerry",
      "personaRole": "Progject Manager",
      "personaProfile": "Project Profile",
      "personaTraits": "Behaviour...",
      "personaAttitude": "Attitude",
      "personaMotivation": ""
    }
  ],
  "quizzes": [
    {
      "quizId": 1,
      "quizLength": 3,
      "quizTopic": "Scope management",
      "passRate": 70, //in %
      "immediateFeedback": false,
      "timer": true,
      "time": 20,  //in minutes
      "quizQuestions": [
        //fix lenght of four, in order. Or can be a dictionary, each map to a letter: "A":"choices"
        {
          "questionId": 1,
          "question": "What componenet does not need to be included in the Scope statement?",
          "choices": {
            "A":"Scope", 
            "B":"Objective", 
            "C":"Milestone", 
            "D":"risk mitigation"
            },
          "correctAnswer": "A",
          "explanation": "risk mitigation is not becuase it bleongs to risk management"
        },
        {
          "questionId": 2,
          "question": "Questions2",
          "choices": {
            "A":"Scope", 
            "B":"Objective", 
            "C":"Milestone", 
            "D":"risk mitigation"
            },
          "correctAnswer": "A",
          "explanation": "explanation2"
        },
        {
          "questionId": 3,
          "question": "Questions3?",
          "choices": {
            "A":"Scope", 
            "B":"Objective", 
            "C":"Milestone", 
            "D":"risk mitigation"
            },
          "correctAnswer": "A",
          "explanation": "explanation3"
        }
      ]
    },
    {
      "quizId": 2,
      "quizLength": 3,
      "quizTopic": "topic",
      "passRate": 70,
      "immediateFeedback": true,
      "timer": true,
      "time": 300, //seconds
      "quizQuestions": [
        {
          "questionId": 1,
          "question": "questions",
          "choices": ["choice 1", "choice 2", "choice 3", "choice 4"],
          "correctAnswer": 0,
          "explanation": "explanation"
        }
        //other questions....
      ]
    }
  ],
  "scenarios": [
    {
      "scenarioId": 1,
      "scenarioName": "Stakeholder requests AI integration into the scope of the system",
      "description": "Midway through the execution phase, a senior stakeholder from the Strategy & Innovation team requests the integration of an AI-powered recommendation engine into the customer dashboard. The feature was not part of the original scope, and no budget or timeline buffer was allocated for AI development. The stakeholder argues that this addition could significantly boost user engagement and attract investor interest, but the engineering team warns of architectural complexity and potential delays. Budget: $150,000 AUD remaining, no contingency Time: 4 weeks left until public launch Scope: Core dashboard features, analytics, and user settings — AI not included",
      "actionsToDo": "Review scope & change-control impact. Draft 2–3 options with trade-offs and timelines. Prepare stakeholder comms plan & decision log.",
      "furtherConstraint": "Technical debt & integration risks.\nInvestor narrative vs. launch certainty.\nPilot/feature flag to de-risk timelines.",
      "sampleQuestions": [
        "what is the impact on time?",
        "what is your current progress?",
        "Do we have the skill?"
      ],
      "sampleAnswer": "Decision: Defer AI integration to a post-launch iteration to protect the MVP launch date.\n\nRationale (Frameworks)\nTriple Constraint: Holding scope constant now avoids schedule/budget slip.\nMoSCoW: AI = Could/Should; MVP items = Must.\nRACI: Sponsor/PM own change-control; Eng Lead runs feasibility spike; UX flags impacts; QA validates regressions.\nRisk: Log scope creep; plan a feature-flag pilot next iteration to de-risk."
    },
    {
      "scenarioId": 2,
      "scenarioName": "name",
      "description": "description",
      "actionsToDo": "actions to do",
      "furtherConstraint": "constraint",
      "sampleQuestions": ["q1", "q2"],
      "sampleAnswer": "sample answer"
    }
  ]
}

```

## Decomposition
Below is the the data structure of each entity: Game, Quiz, Quiz questions, Scenario, Persona
### Game
```json
{
  "gameId": 1,
  "gameTitle": "Title",
  "gameDescription": "The background of the game..",
  "createdBy": 1,
  "scenarioNum": 2,
  "personas": [],
  "scenarios": [],
  "quizzes": []
}

```

### Persona
```json
{
  "personaAvatar": " ",//filepath
  "personaId": 1,
  "personaName": "Jerry",
  "personaRole": "Progject Manager",
  "personaProfile": "Project Profile",
  "personaTraits": "Behaviour...",
  "personaAttitude": "Attitude",
  "personaMotivation": ""
},

```

### Quiz
```json
{
  "quizId": 1,
  "quizLength": 3,
  "quizTopic": "Scope management",
  "passRate": 70,
  "immediateFeedback": false,
  "timer": true,
  "time": 300, //seconds
  "quizQuestions": []
}

```

### Quiz questions
```json
{
  "questionId": 1,
  "question": "What componenet does not need to be included in the Scope statement?",
  "choices": {
    "A":"Scope", 
    "B":"Objective", 
    "C":"Milestone", 
    "D":"risk mitigation"
    },
  "correctAnswer": "A",
  "explanation": "risk mitigation is not becuase it bleongs to risk management"
}
```

## Scenario
```json
{
  "scenarioId": 1,
  "scenarioName": "name",
  "description": "description",
  "actionsToDo": "actions to do",
  "furtherConstraint": "constraint",
  "sampleQuestions": ["what is the impact on time?", "what is your current progress?"],
  "sampleAnswer": "sample answer"
}

```

## GET all quiz questions /quiz/all

Get all quiz question available to be use
To optimize, maybe show only 20 at a time 

**Response**
```json
{[
  {"questionId": 1,
  "question": "What componenet does not need to be included in the Scope statement?",
  "choices": {
    "A":"Scope", 
    "B":"Objective", 
    "C":"Milestone", 
    "D":"risk mitigation"
    },
  "correctAnswer": "A",
  "explanation": "risk mitigation is not becuase it bleongs to risk management"},
  {"questionId": 2,
  "question": "What componenet does not need to be included in the Scope statement?",
  "choices": {
    "A":"Scope", 
    "B":"Objective", 
    "C":"Milestone", 
    "D":"risk mitigation"
    },
  "correctAnswer": "A",
  "explanation": "risk mitigation is not becuase it bleongs to risk management"}
]}
```

## GET all personas /persona/all
**Response**
```json
{[
  {
  "personaAvatar": " ",//filepath
  "personaId": 1,
  "personaName": "Jerry",
  "personaRole": "Progject Manager",
  "personaProfile": "Project Profile",
  "personaTraits": "Behaviour...",
  "personaAttitude": "Attitude",
  "personaMotivation": ""
},
{
  "personaAvatar": " ",//filepath
  "personaId": 2,
  "personaName": "Jerry",
  "personaRole": "Progject Manager",
  "personaProfile": "Project Profile",
  "personaTraits": "Behaviour...",
  "personaAttitude": "Attitude",
  "personaMotivation": ""
}
]}
```

## POST new games /games/create
```json
{
  "gameTitle": "Title",
  "gameDesc": "The background of the game..",
  "numScenario": 2,
  "createdBy": 1,
  "personas": [1, 2, 3, 4, 5], //list of persona ids
  "quizzes": [
    {
      "quizId": 1,
      "quizLength": 3,
      "quizTopic": "Scope management",
      "passRate": 70, //in %
      "immediateFeedback": false,
      "timer": true,
      "time": 20,  //in minutes
      "quizQuestions": [
        //fix lenght of four, in order. Or can be a dictionary, each map to a letter: "A":"choices"
        {
          "question": "What componenet does not need to be included in the Scope statement?",
          "choices": {
            "A":"Scope", 
            "B":"Objective", 
            "C":"Milestone", 
            "D":"risk mitigation"
            },
          "correctAnswer": "A",
          "explanation": "risk mitigation is not becuase it bleongs to risk management"
        },
        {
          "question": "Questions2",
          "choices": {
            "A":"Scope", 
            "B":"Objective", 
            "C":"Milestone", 
            "D":"risk mitigation"
            },
          "correctAnswer": "A",
          "explanation": "explanation2"
        },
        {
          "question": "Questions3?",
          "choices": {
            "A":"Scope", 
            "B":"Objective", 
            "C":"Milestone", 
            "D":"risk mitigation"
            },
          "correctAnswer": "A",
          "explanation": "explanation3"
        },
        {
          "question": "Questions4?",
          "choices": {
            "A":"Scope", 
            "B":"Objective", 
            "C":"Milestone", 
            "D":"risk mitigation"
            },
          "correctAnswer": "A",
          "explanation": "explanation3"
        }
      ]
    },
    {
      "quizId": 2, //incremental id, can be determined by frontend
      "quizLength": 3,
      "quizTopic": "topic",
      "passRate": 70,
      "immediateFeedback": true,
      "timer": true,
      "time": 300, //seconds
      "quizQuestions": [
        {
          "questionId": 1,
          "question": "questions",
          "choices": {
            "A":"Scope", 
            "B":"Objective", 
            "C":"Milestone", 
            "D":"risk mitigation"
            },
          "correctAnswer": "A",
          "explanation": "explanation"
        }
        //other questions....
      ]
    }
  ],
  "scenarios": [
    {
      "scenarioId": 1,
      "scenarioName": "Stakeholder requests AI integration into the scope of the system",
      "description": "Midway through the execution phase, a senior stakeholder from the Strategy & Innovation team requests the integration of an AI-powered recommendation engine into the customer dashboard. The feature was not part of the original scope, and no budget or timeline buffer was allocated for AI development. The stakeholder argues that this addition could significantly boost user engagement and attract investor interest, but the engineering team warns of architectural complexity and potential delays. Budget: $150,000 AUD remaining, no contingency Time: 4 weeks left until public launch Scope: Core dashboard features, analytics, and user settings — AI not included",
      "timeLimit": 600,
      "primaryTask":"qwe",
      "keyFacts": "Review scope & change-control impact. Draft 2–3 options with trade-offs and timelines. Prepare stakeholder comms plan & decision log.",
      "furtherConstraint": "Technical debt & integration risks.\nInvestor narrative vs. launch certainty.\nPilot/feature flag to de-risk timelines.",
      "sampleQuestions": [
        "what is the impact on time?",
        "what is your current progress?",
        "Do we have the skill?"
      ],
      "sampleAnswer": "Decision: Defer AI integration to a post-launch iteration to protect the MVP launch date.\n\nRationale (Frameworks)\nTriple Constraint: Holding scope constant now avoids schedule/budget slip.\nMoSCoW: AI = Could/Should; MVP items = Must.\nRACI: Sponsor/PM own change-control; Eng Lead runs feasibility spike; UX flags impacts; QA validates regressions.\nRisk: Log scope creep; plan a feature-flag pilot next iteration to de-risk.",
      "commonMistakes":  "common mistake",
      "scoringRubric": "rubric, related to marking",
      "successCriteria": "key for success",

    },
    {
      "scenarioId": 2,
      "scenarioName": "name",
      "description": "description",
      "timeLimit": 60,
      "primaryTask":"qwe",
      "keyFacts": "actions to do",
      "furtherConstraint": "constraint",
      "sampleQuestions": ["q1", "q2"],
      "sampleAnswer": "sample answer",
      "commonMistakes":  "common mistake",
      "scoringRubric": "rubric, related to marking",
      "successCriteria": "key for success"
    }
    
  ]
}
```

## Post save game score for student /game/score
request body
```json
{ 
  "gameId": 1, 
  "studentId": 1,
  "quizScore": 80,
  "scenarioScore": 90,
  "strengthAndWeakness": "..."
}
```
response status code 200
```json
{
  "gameId": 1,
  "studentId": 1
}
```

## GET data for student dashboard /student/overview/:id
response
```json
{
  "gameNum": 10,
  "gameComplete":2,
  "totalQuizScore": 80,
  "totalScenarioScore":78,
  "strengthAndWeakness": "..."
}
```

## GET all record of a student /student/reports/;id
**Note** : this API serves both
- display all records (score only)
- display a particualr record (score and strength)
  
response
```json
[
  {
    "gameId": 1,
    "quizScore": 80,
    "scenarioScore": 78,
    "strengthAndWeakness":"good"
  },
  {
    "gameId": 2,
    "quizScore": 80,
    "scenarioScore": 78,
    "strengthAndWeakness":"good"
  },
  {
    "gameId": 3,
    "quizScore": 80,
    "scenarioScore": 78,
    "strengthAndWeakness":"good"
  }
]
```

## GET strength and weakness from each report /student/performance/:id
response
```json
{
  "hasResult": true,
  "Result":[
    "...",
    "...",
    "...",
    "..."
  ]
}
```

## POST update student strength and weakness /student/performance/:id
request body
```json
{
  {"strengthAndWeakness":"..."}
}
```
response
```json
{
  {"detail": "successfully update"}
}
```
