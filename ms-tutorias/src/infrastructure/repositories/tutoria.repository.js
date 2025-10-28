const { randomUUID } = require('crypto');
const tutoriasDB = [];

const save = async (tutoria) => {
    // Si la tutoría ya existe, la actualiza. Si no, la crea.
    const index = tutoriasDB.findIndex(t => t.idTutoria === tutoria.idTutoria);
    if (index !== -1) {
        tutoriasDB[index] = tutoria;
    } else {
        tutoria.idTutoria = randomUUID();
        tutoriasDB.push(tutoria);
    }
    return tutoria;
};

module.exports = { save };