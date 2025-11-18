// ms-agenda/src/domain/services/agenda.service.js
const agendaRepository = require('../../infrastructure/repositories/agenda.repository');

// La función 'verificarDisponibilidad' no cambia y se queda como está.
const verificarDisponibilidad = async (idTutor, fechaHoraSolicitada) => {
    const fechaSolicitada = new Date(fechaHoraSolicitada);
    const bloqueosDelTutor = await agendaRepository.findBloqueosByTutor(idTutor);

    // Debug: Log de los bloqueos recibidos
    console.log('[Agenda Service] Bloqueos recibidos para tutor', idTutor, ':', JSON.stringify(bloqueosDelTutor, null, 2));

    const hayConflicto = bloqueosDelTutor.some(bloqueo => {
        try {
            // PostgreSQL devuelve los nombres de columnas en minúsculas por defecto
            // Intentar ambos formatos: camelCase y lowercase
            const fechaInicio = bloqueo.fechaInicio || bloqueo.fechainicio;
            const duracionMinutos = bloqueo.duracionMinutos || bloqueo.duracionminutos;

            // Debug: Log del bloqueo actual
            console.log('[Agenda Service] Procesando bloqueo:', {
                bloqueo: bloqueo,
                fechaInicio: fechaInicio,
                duracionMinutos: duracionMinutos
            });

            // Validar que el bloqueo tenga fechaInicio y duracionMinutos
            if (!bloqueo || !fechaInicio || duracionMinutos === undefined) {
                console.warn('[Agenda Service] Bloqueo inválido encontrado:', bloqueo);
                return false; // Ignorar bloqueos inválidos
            }

            // Asegurar que fechaInicio sea un objeto Date (PostgreSQL puede devolverlo como string)
            let inicioBloqueo;
            if (fechaInicio instanceof Date) {
                inicioBloqueo = fechaInicio;
            } else if (typeof fechaInicio === 'string') {
                inicioBloqueo = new Date(fechaInicio);
            } else {
                console.warn('[Agenda Service] fechaInicio no es Date ni string:', fechaInicio, 'tipo:', typeof fechaInicio);
                return false; // Ignorar bloqueos con fechaInicio inválida
            }

            // Validar que la fecha sea válida
            if (isNaN(inicioBloqueo.getTime())) {
                console.warn('[Agenda Service] fechaInicio no es una fecha válida:', fechaInicio);
                return false;
            }

            const finBloqueo = new Date(inicioBloqueo.getTime() + duracionMinutos * 60000);

            // La fecha solicitada cae dentro de un bloqueo existente
            return fechaSolicitada >= inicioBloqueo && fechaSolicitada < finBloqueo;
        } catch (error) {
            console.error('[Agenda Service] Error procesando bloqueo:', error, 'Bloqueo:', bloqueo);
            return false; // Ignorar bloqueos con errores
        }
    });

    return { disponible: !hayConflicto };
};

const crearBloqueo = async (idTutor, datosDelBody) => {
    // Para mayor claridad, renombramos el parámetro de 'datosBloqueo' a 'datosDelBody'
    const { fechaInicio, duracionMinutos, idEstudiante } = datosDelBody;

    // 1. Validamos que los datos necesarios llegaron en el body.
    if (!fechaInicio || !duracionMinutos || !idEstudiante) {
        const error = new Error('Faltan datos requeridos en el cuerpo de la petición: se necesita fechaInicio, duracionMinutos y idEstudiante.');
        error.statusCode = 400; // Bad Request
        throw error;
    }

    // 2. Re-validar disponibilidad para evitar race conditions
    const { disponible } = await verificarDisponibilidad(idTutor, fechaInicio);
    if (!disponible) {
        const error = new Error('El horario solicitado ya no está disponible.');
        error.statusCode = 409; // 409 Conflict
        throw error;
    }

    // 3. Construimos el objeto a guardar de forma explícita.
    // ESTE ES EL CAMBIO CLAVE. Evitamos el 'spread operator' que puede ser ambiguo
    // y en su lugar, mapeamos cada campo directamente.
    const datosParaGuardar = {
        idTutor: idTutor,
        fechaInicio: new Date(fechaInicio),
        duracionMinutos: duracionMinutos,
        idEstudiante: idEstudiante
    };

    const nuevoBloqueo = await agendaRepository.saveBloqueo(datosParaGuardar);
    return nuevoBloqueo;
};

const cancelarBloqueo = async (idBloqueo) => {
    if (!idBloqueo) {
        const error = new Error('El parámetro idBloqueo es requerido.');
        error.statusCode = 400; // Bad Request
        throw error;
    }

    const bloqueoEliminado = await agendaRepository.eliminarBloqueo(idBloqueo);
    return bloqueoEliminado;
};
// ===================================

module.exports = {
    verificarDisponibilidad,
    crearBloqueo,
    cancelarBloqueo
};