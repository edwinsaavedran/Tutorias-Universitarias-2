// ms-tutorias/src/infrastructure/clients/usuarios.client.js
const axios = require('axios');
const CircuitBreaker = require('opossum');
const { usuariosServiceUrl } = require('../../config');
const { publishTrackingEvent } = require('../messaging/message.producer');

// Función helper para trackear eventos
const track = (cid, message, status = 'INFO') => {
    publishTrackingEvent({
        service: 'MS_Tutorias',
        message,
        cid,
        timestamp: new Date(),
        status
    });
};

// Función que realiza la llamada HTTP con timeout de 1.5s
const realizarLlamadaHttp = async (url, correlationId) => {
    const response = await axios.get(url, {
        headers: { 'X-Correlation-ID': correlationId },
        timeout: 1500 // Timeout de 1.5 segundos
    });
    return response.data;
};

// Configuración del Circuit Breaker
// Se abre después de 2-3 fallos consecutivos
const breakerOptions = {
    timeout: 1500, // Timeout de 1.5 segundos
    errorThresholdPercentage: 50, // Se abre cuando el 50% de las llamadas fallan
    volumeThreshold: 2, // Mínimo de 2 llamadas antes de evaluar el porcentaje de error
    resetTimeout: 30000, // Espera 30 segundos antes de intentar cerrar el breaker
    rollingCountTimeout: 10000, // Ventana de tiempo para contar fallos
    rollingCountBuckets: 10, // Número de buckets para contar
    name: 'ms-usuarios-breaker',
    enabled: true
};

// Crear el Circuit Breaker
const breaker = new CircuitBreaker(realizarLlamadaHttp, breakerOptions);

// Event listeners del Circuit Breaker
breaker.on('open', () => {
    console.error('[Circuit Breaker] Circuit Breaker ABIERTO para ms-usuarios');
    // Reportar al dashboard cuando se abre (sin correlationId específico, usamos 'system')
    track('system', 'Circuit Breaker ABIERTO para ms-usuarios', 'ERROR');
});

breaker.on('halfOpen', () => {
    console.log('[Circuit Breaker] Circuit Breaker en estado HALF-OPEN para ms-usuarios');
});

breaker.on('close', () => {
    console.log('[Circuit Breaker] Circuit Breaker CERRADO para ms-usuarios');
});

const getUsuario = async (tipo, id, correlationId) => {
    // Construimos la URL
    const url = `${usuariosServiceUrl}/${tipo}/${id}`;

    // --- LOGS DE DEPURACIÓN ---
    console.log(`[SUPER-DEBUG] Iniciando llamada a getUsuario con Correlation-ID: ${correlationId}`);
    console.log(`[SUPER-DEBUG] URL de destino: ${url}`);
    console.log(`[SUPER-DEBUG] Tipo: ${tipo}, ID: ${id}`);
    // --- FIN LOGS DE DEPURACIÓN ---

    try {
        // Usar el Circuit Breaker para envolver la llamada
        const data = await breaker.fire(url, correlationId);
        console.log(`[SUPER-DEBUG] Éxito en la llamada a ${url}.`);
        return data;
    } catch (error) {
        // --- LOGS DE ERROR DETALLADOS ---
        console.error(`[SUPER-DEBUG] FALLO en la llamada a ${url}.`);
        
        // Si el Circuit Breaker está abierto, reportar al dashboard con el correlationId
        if (breaker.opened) {
            track(correlationId, 'Circuit Breaker ABIERTO para ms-usuarios', 'ERROR');
        }
        
        if (error.response) {
            // Este bloque se ejecuta si el servidor SÍ respondió, pero con un error (4xx, 5xx)
            console.error(`[SUPER-DEBUG] El servidor respondió con Status: ${error.response.status}`);
            console.error(`[SUPER-DEBUG] Data del error:`, JSON.stringify(error.response.data));
            if (error.response.status === 404) {
                return null;
            }
        } else if (error.request) {
            // Este bloque se ejecuta si la petición se hizo pero NUNCA se recibió respuesta (error de red)
            console.error('[SUPER-DEBUG] La petición fue enviada pero no se recibió respuesta. Error de red (timeout, DNS, etc).');
        } else if (error.code === 'ECIRCUITOPEN') {
            // Error cuando el Circuit Breaker está abierto
            console.error('[SUPER-DEBUG] Circuit Breaker está ABIERTO. Llamada rechazada.');
            track(correlationId, 'Circuit Breaker ABIERTO para ms-usuarios', 'ERROR');
        } else {
            // Este bloque se ejecuta si hubo un error al configurar la petición antes de enviarla
            console.error('[SUPER-DEBUG] Error fatal al configurar la petición axios:', error.message);
        }
        console.error('[SUPER-DEBUG] Objeto de error completo de Axios:', error.code, error.message);
        // --- FIN LOGS DE ERROR DETALLADOS ---
        throw error;
    }
};

module.exports = { getUsuario };