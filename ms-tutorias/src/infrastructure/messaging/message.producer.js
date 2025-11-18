// ms-tutorias/src/infrastructure/messaging/message.producer.js
const amqp = require('amqplib');
const { rabbitmqUrl } = require('../../config');

let connection = null;
let channel = null;
const EXCHANGE_NAME = 'tracking_events_exchange'; // Nombre del exchange de tracking

const connect = async () => {
    try {
        connection = await amqp.connect(rabbitmqUrl);
        channel = await connection.createChannel();

        // Asegurarse que el exchange de tracking exista
        await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });

        console.log('[MS_Tutorias] Conectado a RabbitMQ y exchange de tracking asegurado.');
    } catch (error) {
        console.error('[MS_Tutorias] Error al conectar con RabbitMQ:', error.message);
        setTimeout(connect, 5000);
    }
};

connect();

// Función para publicar en una COLA (para notificaciones)
const publishToQueue = async (queueName, messagePayload) => {
    if (!channel) { return; }
    try {
        // Declarar la cola con los mismos argumentos que ms-notificaciones (DLQ)
        // Esto evita el error PRECONDITION_FAILED cuando la cola ya existe con DLX configurado
        const dlxExchangeName = 'notificaciones_dlx';
        await channel.assertQueue(queueName, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': dlxExchangeName,
                'x-dead-letter-routing-key': ''
            }
        });
        const messageBuffer = Buffer.from(JSON.stringify(messagePayload));
        channel.sendToQueue(queueName, messageBuffer, { persistent: true });
        console.log(`[MS_Tutorias] Mensaje publicado en la cola '${queueName}'`);
    } catch (error) {
        console.error(`[MS_Tutorias] Error al publicar en cola:`, error.message);
    }
};

// --- NUEVA FUNCIÓN ---
// Función para publicar en un EXCHANGE (para tracking)
const publishTrackingEvent = async (payload) => {
    if (!channel) { return; }
    try {
        const messageBuffer = Buffer.from(JSON.stringify(payload));
        // Publicar en el exchange. El routing key ('') es ignorado por 'fanout'.
        channel.publish(EXCHANGE_NAME, '', messageBuffer);
        console.log(`[MS_Tutorias] Evento de tracking publicado:`, payload.message);
    } catch (error) {
        console.error(`[MS_Tutorias] Error al publicar evento de tracking:`, error.message);
    }
};

module.exports = {
    publishToQueue,
    publishTrackingEvent // <-- Exportar la nueva función
};