ms-usuarios/
├── src/                      # Directorio principal del código fuente
│   ├── api/                  # Capa de API (Express, Fastify, etc.)
│   │   ├── routes/           # Definición de las rutas REST
│   │   │   └── usuarios.routes.js
│   │   ├── controllers/      # Controladores: manejan req/res HTTP
│   │   │   └── usuarios.controller.js
│   │   └── middlewares/      # Middlewares (logging, errores, etc.)
│   │       ├── errorHandler.js
│   │       └── requestLogger.js
│   │
│   ├── domain/               # Lógica de negocio y reglas principales
│   │   ├── services/         # Orquestación de la lógica de negocio
│   │   │   └── usuarios.service.js
│   │   └── models/           # Modelos de dominio (entidades)
│   │       ├── Estudiante.js
│   │       └── Tutor.js
│   │
│   ├── infrastructure/         # Capa de infraestructura (detalles externos)
│   │   └── repositories/     # Acceso a datos (simulado o real)
│   │       └── usuarios.repository.js
│   │
│   ├── config/               # Configuración de la aplicación
│   │   └── index.js          # Carga de variables de entorno, etc.
│   │
│   └── app.js                # Punto de entrada de la aplicación, configuración del servidor
│
├── tests/                    # Pruebas automatizadas
│   ├── unit/                 # Pruebas unitarias (ej. para un servicio)
│   └── integration/          # Pruebas de integración (ej. ruta -> controlador -> servicio)
│
├── docs/                     # Documentación
│   └── swagger.yaml          # Definición OpenAPI/Swagger
│
├── .env.example              # Ejemplo de variables de entorno
├── .gitignore                # Archivos y carpetas a ignorar por Git
├── Dockerfile                # Instrucciones para construir la imagen del contenedor
└── package.json              # Metadatos del proyecto y dependencias (asumiendo Node.js)