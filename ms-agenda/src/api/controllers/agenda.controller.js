// ms-agenda/src/api/controllers/agenda.controller.js
const agendaService = require('../../domain/services/agenda.service');

const getDisponibilidad = async (req, res, next) => {
    try {
        const { id_tutor } = req.params;
        const { fechaHora } = req.query; // ej: ?fechaHora=2025-10-22T14:00:00Z

        if (!fechaHora) {
            const error = new Error('El parámetro "fechaHora" es requerido.');
            error.statusCode = 400; // Bad Request
            throw error;
        }

        const resultado = await agendaService.verificarDisponibilidad(id_tutor, fechaHora);
        res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const postBloqueo = async (req, res, next) => {
    try {
        const { id_tutor } = req.params;
        const datosBloqueo = req.body; // { fechaInicio, duracionMinutos, idEstudiante }

        const nuevoBloqueo = await agendaService.crearBloqueo(id_tutor, datosBloqueo);
        res.status(201).json(nuevoBloqueo);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDisponibilidad,
    postBloqueo
};