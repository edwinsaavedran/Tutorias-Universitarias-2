// ms-notificaciones/src/app.js
const express = require('express');
const notificacionesRouter = require('./api/routes/notificaciones.routes');
const errorHandler = require('./api/middlewares/errorHandler'); // Reutilizamos el mismo middleware
const correlationIdMiddleware = require('./api/middlewares/correlationId.middleware.js');

const PORT = process.env.PORT || 3003;
const app = express();

app.use(express.json());
app.use(correlationIdMiddleware); // <--- AÑADIR ESTA LÍNEA
app.use('/notificaciones', notificacionesRouter);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`MS_Notificaciones escuchando en el puerto ${PORT}`);
});