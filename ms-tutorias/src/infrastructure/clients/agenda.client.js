const axios = require('axios');
const { agendaServiceUrl } = require('../../config');

const  verificarDisponibilidad = async (idTutor, fechaHora, correlationId) => {
    const url = `${agendaServiceUrl}/tutores/${idTutor}/disponibilidad?fechaHora=${fechaHora}`;
    const response = await axios.get(url, {
        headers: { 'X-Correlation-ID': correlationId }
    });
    return response.data.disponible;
};

const bloquearAgenda = async (idTutor, payload, correlationId) => {    
    const url = `${agendaServiceUrl}/tutores/${idTutor}/bloquear`;
    // Se añade el header a la petición POST
    const response = await axios.post(url, payload, {
        headers: { 'X-Correlation-ID': correlationId }
    });
    return response.data;
};

const cancelarBloqueo = async (idBloqueo, correlationId) => {
    const url = `${agendaServiceUrl}/bloqueos/${idBloqueo}`;
    const response = await axios.delete(url, {
        headers: { 'X-Correlation-ID': correlationId }
    });
    return response.data;
};

module.exports = { verificarDisponibilidad, bloquearAgenda, cancelarBloqueo };