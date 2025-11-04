# Tutorias Universitarias 2
Proyecto académico diseñado para construir y demostrar una arquitectura de microservicios robusta, resiliente y moderna para un sistema de gestión de tutorías universitarias.

## ¿Qué Hace? (Funcionalidad Principal)
El sistema simula el flujo completo de un estudiante que solicita una tutoría:
1.  **Autenticación:** Un cliente (simulador) solicita un token JWT al servicio `ms-auth` proveyendo credenciales.
2.  **Autorización:** El token JWT se utiliza para validar la identidad y el rol (ej. "estudiante") del usuario en rutas protegidas.
3.  **Orquestación de Saga (en `ms-tutorias`):**
    * Valida la existencia del estudiante y el tutor (`ms-usuarios`).
    * Verifica la disponibilidad de horario (`ms-agenda`).
    * Crea la tutoría en la base de datos con estado `PENDIENTE`.
    * Bloquea el horario en la agenda del tutor (`ms-agenda`).
    * Publica un evento asíncrono en RabbitMQ para notificar al usuario.
    * Actualiza la tutoría a estado `CONFIRMADA`.
4.  **Notificación (Consumidor):**
    * `ms-notificaciones` consume el mensaje de la cola de RabbitMQ y (simula) el envío de un email de confirmación.

## Arquitectura y Stack Tecnológico
El proyecto está compuesto por 5 microservicios principales, 3 bases de datos y 1 bróker de mensajería:
* **Arquitectura:** Microservicios
* **Backend:** Node.js con Express.js
* **Contenerización:** Docker (con `Dockerfile` multi-etapa)
* **Orquestación Local:** Docker Compose
* **Bases de Datos:** PostgreSQL (con instancias dedicadas para `usuarios`, `agenda` y `tutorias`)
* **Mensajería Asíncrona:** RabbitMQ (para desacoplar las notificaciones)
* **Seguridad:** Autenticación basada en JWT
* **Trazabilidad:** `X-Correlation-ID` para el seguimiento de peticiones entre servicios.

## Puesta en Marcha (Local)
1.  **Clonar el Repositorio:** `git clone ...`
2.  **Crear Archivos `.env`:** Copia las plantillas `.env.example` de cada servicio (ej. `cp ms-auth/.env.example ms-auth/.env`).
3.  **Construir y Levantar:** Desde la raíz del proyecto, ejecuta:
    ```bash
    docker-compose up --build
    ```
4.  **Inicializar Bases de Datos:** Mientras `docker-compose` corre, conéctate a cada instancia de PostgreSQL (en puertos `5432`, `5433`, `5434`) y ejecuta los scripts SQL de inicialización que se encuentran en los `README.md` de `ms-usuarios`, `ms-agenda` y `ms-tutorias`.
5.  **Ejecutar Simulación:** En una nueva terminal, navega a `client-mobile-sim` e instala sus dependencias (`npm install`). Luego, ejecuta una prueba:
    ```bash
    node index.js solicitar \
    --username "ana.torres" \
    --password "password_ana" \
    --idTutor "t09876" \
    --fecha "2025-12-10T11:00:00Z" \
    --materia "Cálculo Multivariable"
    ```

## Hacia Dónde Apunta (Roadmap)
El objetivo final de este proyecto es evolucionar de la orquestación local a un despliegue completo en la nube:
* **Orquestación de Contenedores:** Migrar de `docker-compose` a **Kubernetes (K8s)** para gestionar el despliegue, escalado y auto-reparación de los servicios.
* **API Gateway:** Integrar **Kong** como Ingress Controller en Kubernetes para manejar el enrutamiento de tráfico externo, la seguridad (validación JWT) y aplicar políticas de forma centralizada.
* **Observabilidad Completa:** Implementar un stack de monitoreo (ej. Prometheus y Grafana), logging centralizado (ej. ELK o Loki) y tracing distribuido (ej. Jaeger) para tener visibilidad completa del sistema en producción.