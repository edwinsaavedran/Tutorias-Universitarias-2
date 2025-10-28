// ms-agenda/src/infrastructure/repositories/agenda.repository.js
const { randomUUID } = require('crypto'); // Para generar IDs únicos

// --- Base de Datos Simulada (en memoria) ---
const bloqueosDB = [
    {
        idBloqueo: 'blk-preexistente-123',
        idTutor: 't54321', // Dr. Carlos Rojas
        fechaInicio: new Date('2025-10-22T10:00:00.000Z'),
        duracionMinutos: 60,
        idEstudiante: 'e12345'
    }
];
// ---------------------------------------------

const findBloqueosByTutor = async (idTutor) => {
    return bloqueosDB.filter(b => b.idTutor === idTutor);
};

const saveBloqueo = async (datosBloqueo) => {
    const nuevoBloqueo = {
        idBloqueo: randomUUID(),
        ...datosBloqueo
    };
    bloqueosDB.push(nuevoBloqueo);
    return nuevoBloqueo;
};

module.exports = {
    findBloqueosByTutor,
    saveBloqueo
};