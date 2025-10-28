// client-mobile-sim/src/scenarios/solicitarTutoria.js
const { v4: uuidv4 } = require('uuid');
const backendClient = require('../api_client/backend.client');

const run = async (args) => {
    const correlationId = uuidv4();
    console.log('=====================================================');
    console.log(`  Iniciando escenario SEGURO: Solicitar Tutoría`);
    console.log(`  ID de Correlación generado: ${correlationId}`);
    console.log('=====================================================');

    try {
        // --- PASO 1: AUTENTICACIÓN ---
        const accessToken = await backendClient.login(args.username, args.password);
        console.log('[CLIENT] Autenticación exitosa. Token JWT recibido.');

        // --- PASO 2: ACCIÓN PROTEGIDA ---
        // Nótese que ya no enviamos 'idEstudiante' en el payload.
        // El backend lo determinará a partir del token.
        const payload = {
            idTutor: args.idTutor,
            fechaSolicitada: args.fecha,
            duracionMinutos: parseInt(args.duracion),
            materia: args.materia
        };

        const resultado = await backendClient.solicitarTutoria(payload, accessToken, correlationId);
        
        console.log('\n ¡ÉXITO! Tutoría confirmada de forma segura.');
        console.log('[CLIENT] <--- Respuesta del Servidor:');
        console.log(JSON.stringify(resultado, null, 2));

    } catch (error) {
        // El error ya se loguea en el cliente, aquí solo mostramos un mensaje final.
        console.error(`\n El escenario falló: ${error.message}`);
    }
    console.log('=====================================================');
};

module.exports = { run };