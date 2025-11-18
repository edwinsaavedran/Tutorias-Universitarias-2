@echo off
REM Script para limpiar bloqueos de prueba en la base de datos (Windows)

echo Limpiando bloqueos de prueba...

REM Limpiar bloqueos del tutor t09876 para la fecha 2025-12-20
docker exec db_agenda_postgres psql -U user_agenda -d db_agenda -c "DELETE FROM bloqueos WHERE idTutor = 't09876' AND fechaInicio >= '2025-12-20 00:00:00+00' AND fechaInicio < '2025-12-21 00:00:00+00';"

echo Bloqueos limpiados. Puedes probar de nuevo con la misma fecha.
pause

