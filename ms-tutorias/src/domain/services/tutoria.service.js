// ms-tutorias/src/domain/services/tutoria.service.js
const tutoriaRepository = require('../../infrastructure/repositories/tutoria.repository');
const usuariosClient = require('../../infrastructure/clients/usuarios.client');
const agendaClient = require('../../infrastructure/clients/agenda.client');
//const notificacionesClient = require('../../infrastructure/clients/notificaciones.client');
const messageProducer = require('../../infrastructure/messaging/message.producer'); // Importar el productor de mensajes

// Servicio principal para solicitar una tutoría
const solicitarTutoria = async (datosSolicitud, correlationId) => {
    const { idEstudiante, idTutor, fechaSolicitada, duracionMinutos, materia } = datosSolicitud;
    let nuevaTutoria; // Declarar fuera para que esté disponible en el catch

    try {
        // --- 1. Validar existencia de estudiante y tutor ---
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Validando usuarios...`);
        const [estudiante, tutor] = await Promise.all([
            usuariosClient.getUsuario('estudiantes', idEstudiante, correlationId),
            usuariosClient.getUsuario('tutores', idTutor, correlationId)
        ]);
        if (!estudiante) throw { statusCode: 404, message: 'Estudiante no encontrado' };
        if (!tutor) throw { statusCode: 404, message: 'Tutor no encontrado' };
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Usuarios validados.`);

        // --- 2. Verificar disponibilidad en la agenda ---
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Verificando agenda...`);
        const disponible = await agendaClient.verificarDisponibilidad(idTutor, fechaSolicitada, correlationId);
        if (!disponible) throw { statusCode: 409, message: 'Horario no disponible' };
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Agenda verificada (disponible).`);

        // --- 3. Crear y persistir la tutoría en estado PENDIENTE ---
        const tutoriaPendienteData = {
            idEstudiante,
            idTutor,
            fecha: new Date(fechaSolicitada), // Asegurar que sea objeto Date
            materia,
            estado: 'PENDIENTE',
            // createdAt lo maneja la BD automáticamente
        };
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Preparando para guardar (INSERT):`, JSON.stringify(tutoriaPendienteData));
        nuevaTutoria = await tutoriaRepository.save(tutoriaPendienteData); // GUARDAMOS EL RESULTADO CON EL ID
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Tutoría PENDIENTE guardada (ID: ${nuevaTutoria.idtutoria}).`); // Usar minúscula si así lo devuelve pg

        // --- 4. Realizar acciones (comandos) ---
        //console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Intentando bloquear agenda...`);
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Publicando evento de notificación...`);

        const payloadAgenda = { fechaInicio: fechaSolicitada, duracionMinutos, idEstudiante };
        await agendaClient.bloquearAgenda(idTutor, payloadAgenda, correlationId);
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Bloqueo de agenda exitoso.`);

        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Intentando enviar notificación...`);
        
        // const payloadNotificacion = {
        //     destinatario: estudiante.email,
        //     asunto: `Tutoría de ${materia} confirmada`,
        //     cuerpo: `Hola ${estudiante.nombrecompleto || estudiante.nombreCompleto}, tu tutoría con ${tutor.nombrecompleto || tutor.nombreCompleto} ha sido confirmada para el ${new Date(fechaSolicitada).toLocaleString()}.` // Ajustar nombre de campo si es necesario
        // };

        const payloadNotificacion = {
            destinatario: estudiante.email,
            asunto: `Tutoría de ${materia} confirmada`,
            cuerpo: `Hola ${estudiante.nombrecompleto || estudiante.nombreCompleto}, tu tutoría con ${tutor.nombrecompleto || tutor.nombreCompleto} ha sido confirmada para el ${new Date(fechaSolicitada).toLocaleString()}.`,
            correlationId: correlationId // <-- 3. Buena práctica: pasar el CID en el mensaje
        };

        //await notificacionesClient.enviarEmail(payloadNotificacion, correlationId);
        //console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Envío de notificación exitoso.`);
        messageProducer.publishToQueue('notificaciones_email_queue', payloadNotificacion); // <- 4. Publicar en la cola
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Evento de notificación publicado.`);

        // --- 5. Si todo fue exitoso, actualizar estado a CONFIRMADA ---
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Actualizando estado a CONFIRMADA...`);
        const tutoriaConfirmadaPayload = {
            idTutoria: nuevaTutoria.idtutoria, // Usar el ID obtenido del INSERT
            estado: 'CONFIRMADA',
            error: null // Limpiar cualquier error previo si existiera
        };
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Preparando para guardar (UPDATE - CONFIRMADA):`, JSON.stringify(tutoriaConfirmadaPayload));
        const tutoriaConfirmada = await tutoriaRepository.save(tutoriaConfirmadaPayload);
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Actualización a CONFIRMADA exitosa.`);
        return tutoriaConfirmada; // Retorna la tutoría confirmada y TERMINA el flujo exitoso

    } catch (error) {
        // --- Patrón de Compensación (Saga) ---
        // Loguear el error ORIGINAL que nos trajo aquí
        console.error(`\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
        console.error(`[MS_Tutorias Service] - CID: ${correlationId} - ERROR CAPTURADO DENTRO DE LA SAGA: ${error.message}`);
        console.error(`Stack Original:`, error.stack);
        console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`);

        // Si el error ocurrió ANTES de crear la tutoría pendiente, simplemente relanzamos el error
        if (!nuevaTutoria || !nuevaTutoria.idtutoria) {
            console.error(`[MS_Tutorias Service] - CID: ${correlationId} - Error ocurrió ANTES de crear registro PENDIENTE. No hay compensación de BD.`);
            throw { statusCode: error.statusCode || 500, message: `Fallo inicial en la solicitud: ${error.message}` };
        }

        // Si ya existe la tutoría (al menos en estado PENDIENTE), intentamos marcarla como FALLIDA 
        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Intentando compensación: Actualizando a FALLIDA (ID: ${nuevaTutoria.idtutoria}).`);
        const compensacionPayload = {
            idTutoria: nuevaTutoria.idtutoria, // MUY IMPORTANTE: Usar el ID existente
            estado: 'FALLIDA',
            error: error.message || 'Error desconocido durante la saga' // Guardar el mensaje de error
        };

        console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Preparando para guardar (UPDATE - FALLIDA):`, JSON.stringify(compensacionPayload));
        try {
            await tutoriaRepository.save(compensacionPayload); // Ejecuta el UPDATE de compensación
            console.log(`[MS_Tutorias Service] - CID: ${correlationId} - Compensación (FALLIDA) guardada exitosamente.`);
        } catch (compensacionError) {
            console.error(`[MS_Tutorias Service] - CID: ${correlationId} - ¡¡ERROR CRÍTICO DURANTE LA COMPENSACIÓN!! No se pudo marcar como FALLIDA.`, compensacionError.stack);
            // Aquí se necesitaría un mecanismo de alerta o reintento más sofisticado
        }

        // Relanzar el error ORIGINAL para que el cliente reciba el 500 apropiado o el código correspondiente
        throw { statusCode: error.statusCode || 500, message: `No se pudo completar la solicitud: ${error.message}` };
    }
};

module.exports = { solicitarTutoria };