ms-agenda/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   └── agenda.routes.js
│   │   ├── controllers/
│   │   │   └── agenda.controller.js
│   │   └── middlewares/
│   │       ├── errorHandler.js
│   │       └── requestLogger.js
│   │
│   ├── domain/
│   │   ├── services/
│   │   │   └── agenda.service.js
│   │   └── models/
│   │       └── Bloqueo.js
│   │
│   ├── infrastructure/
│   │   └── repositories/
│   │       └── agenda.repository.js
│   │
│   ├── config/
│   │   └── index.js
│   │
│   └── app.js
│
├── ... (tests/, docs/, Dockerfile, etc. igual que antes)
└── .env.example