-- Script para agregar restricción de unicidad a bloqueos
ALTER TABLE bloqueos
ADD CONSTRAINT bloqueos_unicos UNIQUE (idTutor, fechaInicio);