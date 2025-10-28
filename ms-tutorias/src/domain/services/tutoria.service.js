// ms-tutorias/src/domain/services/tutoria.service.js
// El El Orquestador de la Saga de Creación de Tutoría

const tutoriaRepository = require('../../infrastructure/repositories/tutoria.repository');
const usuariosClient = require('../../infrastructure/clients/usuarios.client');
const agendaClient = require('../../infrastructure/clients/agenda.client');
const notificacionesClient = require('../../infrastructure/clients/notificaciones.client');

const solicitarTutoria = async (datosSolicitud, correlationId) => {
    const { idEstudiante, idTutor, fechaSolicitada, duracionMinutos, materia } = datosSolicitud;

    // --- 1. Validar existencia de estudiante y tutor en paralelo ---
    const [estudiante, tutor] = await Promise.all([
        usuariosClient.getUsuario( 'estudiantes', idEstudiante, correlationId),
        usuariosClient.getUsuario('tutores', idTutor, correlationId)
    ]);

    if (!estudiante) throw { statusCode: 404, message: 'Estudiante no encontrado' };
    if (!tutor) throw { statusCode: 404, message: 'Tutor no encontrado' };

    // --- 2. Verificar disponibilidad en la agenda ---
    // También pasamos el 'correlationId' aquí.
    console.log(`[MS_Tutorias Service] - Correlation-ID: ${correlationId} - Verificando agenda...`);
    const disponible = await agendaClient.verificarDisponibilidad(idTutor, fechaSolicitada, correlationId);
    if (!disponible) throw { statusCode: 409, message: 'Horario no disponible' };

    // --- 3. Crear y persistir la tutoría en estado PENDIENTE ---
    let nuevaTutoria = {
        idEstudiante,
        idTutor,
        fecha: fechaSolicitada,
        materia,
        estado: 'PENDIENTE',
        createdAt: new Date()
    };
    nuevaTutoria = await tutoriaRepository.save(nuevaTutoria);

    try {
        // --- 4. Realizar acciones (comandos) ---
        // a. Bloquear la agenda
        const payloadAgenda = { fechaInicio: fechaSolicitada, duracionMinutos, idEstudiante };
        await agendaClient.bloquearAgenda(idTutor, payloadAgenda, correlationId);

        // b. Enviar notificación
        const payloadNotificacion = {
            destinatario: estudiante.email,
            asunto: `Tutoría de ${materia} confirmada`,
            cuerpo: `Hola ${estudiante.nombreCompleto}, tu tutoría con ${tutor.nombreCompleto} ha sido confirmada para el ${new Date(fechaSolicitada).toLocaleString()}.`
        };
        await notificacionesClient.enviarEmail(payloadNotificacion, correlationId);

        // --- 5. Si todo fue exitoso, actualizar estado a CONFIRMADA ---
        nuevaTutoria.estado = 'CONFIRMADA';
        return await tutoriaRepository.save(nuevaTutoria);

    } catch (error) {
        // --- Patrón de Compensación (Saga) ---
        // Si algo falla después de crear la tutoría (ej. no se pudo notificar),
        // deberíamos revertir las acciones previas (ej. desbloquear la agenda).
        // Por simplicidad, aquí solo cambiaremos el estado a 'FALLIDA'.
        nuevaTutoria.estado = 'FALLIDA';
        nuevaTutoria.error = error.message;
        await tutoriaRepository.save(nuevaTutoria);
        console.error("Error en la saga de creación de tutoría:", error.message);
        throw { statusCode: 500, message: 'No se pudo completar la solicitud de tutoría.', errorOriginal: error.message };
    }
};

module.exports = { solicitarTutoria };