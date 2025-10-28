const express = require('express');
const agendaRouter = require('./api/routes/agenda.routes');
const errorHandler = require('./api/middlewares/errorHandler'); // Reutilizamos el mismo middleware
const correlationIdMiddleware = require('./api/middlewares/correlationId.middleware.js');

const PORT = process.env.PORT || 3002;
const app = express();

app.use(express.json());
app.use(correlationIdMiddleware); // 
app.use('/agenda', agendaRouter); // Prefijo para las rutas de agenda
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`MS_Agenda escuchando en el puerto ${PORT}`);
});