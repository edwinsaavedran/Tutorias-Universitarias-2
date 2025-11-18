// src/api/middlewares/errorHandler.js


const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${err.message}`);

    // Detectar error de restricción única de Postgres
    if (err.code === '23505') {
        return res.status(409).json({
            error: {
                message: 'Conflicto: El tutor ya tiene un bloqueo en ese horario.',
                statusCode: 409
            }
        });
    }

    const statusCode = err.statusCode || 500;
    const errorMessage = err.statusCode ? err.message : 'Ocurrió un error inesperado en el servidor.';

    res.status(statusCode).json({
        error: {
            message: errorMessage,
            statusCode: statusCode
        }
    });
};

module.exports = errorHandler;