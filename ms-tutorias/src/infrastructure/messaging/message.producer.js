// ms-tutorias/src/infrastructure/messaging/message.producer.js
const amqp = require('amqplib');
const { rabbitmqUrl } = require('../../config');

// Variable para mantener la conexión y el canal
let connection = null;
let channel = null;

// Conectarse a RabbitMQ
const connect = async () => {
    try {
        connection = await amqp.connect(rabbitmqUrl);
        channel = await connection.createChannel();
        console.log('[MS_Tutorias] Conectado a RabbitMQ exitosamente.');
    } catch (error) {
        console.error('[MS_Tutorias] Error al conectar con RabbitMQ:', error.message);
        // Implementar lógica de reintento si es necesario
        setTimeout(connect, 5000); // Reintentar en 5 segundos
    }
};

// Iniciar la conexión
connect();

const publishToQueue = async (queueName, messagePayload) => {
    if (!channel) {
        console.error('[MS_Tutorias] Canal de RabbitMQ no disponible. ¿Está conectado?');
        return;
    }
    try {
        // 1. Asegurarse que la cola exista (durable = los mensajes sobreviven reinicios de RabbitMQ)
        await channel.assertQueue(queueName, { durable: true });

        // 2. Convertir el mensaje (objeto JS) a un Buffer JSON
        const messageBuffer = Buffer.from(JSON.stringify(messagePayload));

        // 3. Enviar el mensaje a la cola (persistent = el mensaje se guarda en disco)
        channel.sendToQueue(queueName, messageBuffer, { persistent: true });

        console.log(`[MS_Tutorias] Mensaje publicado en la cola '${queueName}':`, JSON.stringify(messagePayload));
    } catch (error) {
        console.error(`[MS_Tutorias] Error al publicar mensaje en RabbitMQ:`, error.message);
    }
};

module.exports = {
    publishToQueue
};