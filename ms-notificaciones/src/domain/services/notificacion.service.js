// ms-notificaciones/src/domain/services/notificacion.service.js
const { randomUUID } = require('crypto');
const emailProvider = require('../../infrastructure/providers/email.provider');

const enviarNotificacion = async (canal, datosNotificacion) => {
    const { destinatario, asunto, cuerpo } = datosNotificacion;

    // --- BLOQUE DE VALIDACIÓN AÑADIDO ---
    if (!destinatario || !asunto || !cuerpo) {
        const error = new Error('Faltan datos requeridos en el cuerpo de la petición: se necesita destinatario, asunto y cuerpo.');
        error.statusCode = 400; // Bad Request
        throw error;
    }
    // ------------------------------------

    let resultadoEnvio;

    switch (canal.toLowerCase()) {
        case 'email':
            resultadoEnvio = await emailProvider.enviarEmail(destinatario, asunto, cuerpo);
            break;
        case 'sms':
            const smsError = new Error(`El canal 'sms' no está implementado.`);
            smsError.statusCode = 501; // Not Implemented
            throw smsError;
        default:
            const channelError = new Error(`El canal '${canal}' no es soportado.`);
            channelError.statusCode = 400; // Bad Request
            throw channelError;
    }

    const log = {
        logId: randomUUID(),
        canal: canal,
        destinatario: destinatario, // Ahora este valor sí existirá
        timestamp: new Date().toISOString(),
        estado: resultadoEnvio.estado
    };

    return log;
};

// Simplificamos: este servicio ahora solo sabe enviar emails basado en el payload
const enviarEmailNotificacion = async (payloadNotificacion) => {
    const { destinatario, asunto, cuerpo, correlationId } = payloadNotificacion;

    // Log con el CID
    console.log(`[MS_Notificaciones Service] - CID: ${correlationId || 'N/A'} - Procesando email para: ${destinatario}`);

    if (!destinatario || !asunto || !cuerpo) {
        const error = new Error('Datos incompletos para enviar email: se necesita destinatario, asunto y cuerpo.');
        error.statusCode = 400; // Bad Request
        throw error;
    }

    const resultadoEnvio = await emailProvider.enviarEmail(destinatario, asunto, cuerpo);

    const log = {
        logId: randomUUID(),
        canal: 'email',
        destinatario: destinatario,
        timestamp: new Date().toISOString(),
        estado: resultadoEnvio.estado,
        correlationId: correlationId
    };
    console.log(`[MS_Notificaciones Service] - CID: ${correlationId || 'N/A'} - Email simulado. Log:`, JSON.stringify(log));
    return log;
};

module.exports = {
    //enviarNotificacion
    enviarEmailNotificacion
};