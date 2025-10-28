// src/app.js

const express = require('express');
const usuariosRouter = require('./api/routes/usuarios.routes');
const errorHandler = require('./api/middlewares/errorHandler');
const correlationIdMiddleware = require('./api/middlewares/correlationId.middleware.js');

// Asumimos que la configuración (ej. puerto) se carga desde /config
// Para simplificar, lo definimos aquí por ahora.
const PORT = process.env.PORT || 3001;

const app = express(); // <--- CORRECCIÓN AQUÍ

// Middlewares
app.use(express.json()); // Para parsear bodies JSON
app.use(correlationIdMiddleware); // <--- AÑADIR ESTA LÍNEA

// Rutas
app.use('/usuarios', usuariosRouter);

// Manejador de errores (debe ser el último middleware)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`MS_Usuarios escuchando en el puerto ${PORT}`);
});