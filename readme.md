# HelpDesk Core - Plataforma de Gestión de Solicitudes de Soporte

Plataforma interna diseñada para centralizar, dar trazabilidad, automatizar y medir la gestión de tickets de soporte técnico

---

## 🚀 Tecnologías y Stack Utilizado

- **Frontend:** React, React Router, Lucide Icons, CSS Custom Properties.
- **Backend:** Node.js con **NestJS** (arquitectura modular, controladores, servicios y DTOs).
- **Documentación de API:** Swagger (integrado nativamente).
- **Base de Datos:** PostgreSQL (modelo relacional optimizado con índices y consultas analíticas).

---

## 👥 Roles y Autorización

El sistema maneja un control de acceso basado en roles (RBAC):
- **Administrador:** Control total sobre tickets, asignaciones, usuarios y estados.
- **Agente:** Gestión de tickets asignados, comentarios y actualización de estados.
- **Supervisor:** Visibilidad global, reasignaciones, revisión de tickets sin actualizar y métricas.
- **Cliente:** Creación y seguimiento de sus propias solicitudes.

---

## 🧠 Declaración de Herramientas y Asistencia

Conforme a los lineamientos de la prueba técnica, se declara el uso de las siguientes herramientas para el desarrollo de la solución:
- **Frameworks y librerías:** NestJS, React, React Router, Lucide React, PostgreSQL.
- **Documentación oficial:** NestJS Docs, React Docs, PostgreSQL Docs.
- **Herramientas de Inteligencia Artificial:** Utilizadas como asistente de desarrollo para la estructuración de componentes en React, optimización de consultas SQL analíticas, refinamiento de estilos CSS, depuracion de errores, Codificacion de backend y documentacion de las funciones.

---

## ☁️ Arquitectura y Estrategia de Despliegue en AWS

Para llevar esta solución a un entorno de producción escalable en **Amazon Web Services (AWS)**, se propone la siguiente arquitectura:

1. **Frontend (SPA):** 
   - Hospedado en un bucket de **Amazon S3** estático.
   - Distribuido globalmente mediante **Amazon CloudFront** (CDN) para garantizar baja latencia y entrega segura vía HTTPS.
2. **Backend (API REST):** 
   - Desplegado como contenedores Docker en **AWS ECS (Elastic Container Service)** utilizando **AWS Fargate** (computación serverless para contenedores), permitiendo auto-escalado horizontal según la demanda.
3. **Base de Datos:** 
   - **Amazon RDS para PostgreSQL** con respaldos automáticos, alta disponibilidad (Multi-AZ) y aislamiento en subredes privadas.

---

## 🗄️ Base de Datos y Consultas (`queries.sql`)

El proyecto incluye el archivo `queries.sql` con el modelo relacional completo (usuarios, roles, áreas, tickets, comentarios e historial de trazabilidad con índices avanzados) y la resolución de las consultas analíticas requeridas:
1. Conteo de tickets por estado y cliente.
2. Top 5 clientes con mayor volumen de tickets de prioridad alta o crítica.
3. Identificación de tickets abiertos con más de 48 horas sin actualización.
4. Rendimiento de agentes por cantidad de tickets resueltos en el último mes.
5. Tiempos promedio de resolución segmentados por prioridad.
6. Carga operativa de tickets abiertos por agente.
7. Trazabilidad de tickets reasignados múltiples veces.
8. Porcentaje de efectividad (tickets cerrados vs total) en los últimos 30 días.

---

## ⚙️ Guía Rápida de Ejecución

El proyecto se encuentra completamente dockerizado (recomendado el uso de **Docker Desktop / Rancher Desktop**), por lo que no es estrictamente necesario preparar el entorno de desarrollo localmente de forma manual.

### inicializar el proyecto con docker
Ejecutar en la raiz de todo el proyecto
```bash
docker compose up --build -d
```
El contenedor de la base de datos utiliza el script init.sql para crear las tablas necesarias y poblar datos simulados automáticamente para pruebas.

Nota: Si prefieres una instalación limpia sin datos de prueba, puedes eliminar la sección de inserts simulados en el script de inicialización.

### Credenciales de acceso 
Se crean automáticamente los siguientes usuarios con la contraseña 123456 para cada rol:

Administrador: admin@sistema.com
Agente: agente@sistema.com
Supervisor: supervisor@sistema.com
Cliente: cliente@sistema.com

## Documentación interactiva (Swagger)
Una vez levantado el backend, puedes acceder a la documentación y pruebas de la API en:
http://localhost:3000/api .

para la ejecucion de los tets solo es necesario ejecutar los siguientes comandos en la carpeta backend

```bash
    cd backend
    # Pruebas unitarias
    npm test

    # Pruebas End-to-End (E2E)
    npm run test:e2e
```