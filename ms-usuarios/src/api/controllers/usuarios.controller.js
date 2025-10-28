// src/api/controllers/usuarios.controller.js

const usuariosService = require('../../domain/services/usuarios.service');

const obtenerEstudiante = async (req, res, next) => {
    try {
        const { id } = req.params;
        const estudiante = await usuariosService.getEstudiante(id);
        res.status(200).json(estudiante);
    } catch (error) {
        next(error); // Pasa el error al manejador de errores centralizado
    }
};

const obtenerTutor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tutor = await usuariosService.getTutor(id);
        res.status(200).json(tutor);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    obtenerEstudiante,
    obtenerTutor
};