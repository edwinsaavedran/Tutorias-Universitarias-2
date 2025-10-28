// src/infrastructure/repositories/usuarios.repository.js

// --- Base de Datos Simulada (en memoria) ---
const estudiantesDB = [
    { id: "e12345", nombreCompleto: "Ana Torres", email: "ana.torres@universidad.edu", carrera: "Ingeniería de Software" },
    { id: "e67890", nombreCompleto: "Luis Garcia", email: "luis.garcia@universidad.edu", carrera: "Medicina" }
];

const tutoresDB = [
    { id: "t54321", nombreCompleto: "Dr. Carlos Rojas", email: "carlos.rojas@universidad.edu", especialidad: "Bases de Datos Avanzadas" },
    { id: "t09876", nombreCompleto: "Dra. Elena Solano", email: "elena.solano@universidad.edu", especialidad: "Cálculo Multivariable" }
];
// ---------------------------------------------

const findEstudianteById = async (id) => {
    return estudiantesDB.find(estudiante => estudiante.id === id);
};

const findTutorById = async (id) => {
    return tutoresDB.find(tutor => tutor.id === id);
};

module.exports = {
    findEstudianteById,
    findTutorById
};