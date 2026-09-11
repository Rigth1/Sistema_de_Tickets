-- =========================================================================
-- ARCHIVO: queries.sql
-- Base de datos: PostgreSQL (support_platform)
-- =========================================================================

-- 1. Obtener la cantidad de tickets por estado para cada cliente (creador)
SELECT 
    u.name AS client_name,
    t.status,
    COUNT(t.id) AS total_tickets
FROM tickets t
JOIN users u ON t.created_by = u.id
GROUP BY u.name, t.status
ORDER BY u.name, t.status;


-- 2. Obtener los cinco clientes (creadores) con mayor cantidad de tickets de prioridad alta o urgente
SELECT 
    u.name AS client_name,
    COUNT(t.id) AS critical_tickets, -- Total combinado (sigue ordenando por esto)
    COUNT(CASE WHEN t.priority = 'Alta' THEN 1 END) AS alta_count,     -- Cuántas son de prioridad Alta
    COUNT(CASE WHEN t.priority = 'Urgente' THEN 1 END) AS urgente_count -- Cuántas son de prioridad Urgente
FROM tickets t
JOIN users u ON t.created_by = u.id
WHERE t.priority IN ('Alta', 'Urgente')
GROUP BY u.id, u.name
ORDER BY critical_tickets DESC
LIMIT 5;


-- 3. Obtener los tickets que llevan más de 48 horas sin actualización y que no están cerrados
SELECT 
    t.id,
    t.title,
    t.status,
    t.updated_at
FROM tickets t
WHERE t.status NOT IN ('Cerrado', 'Resuelto')
  AND t.updated_at < NOW() - INTERVAL '48 hours';


-- 4. Obtener el usuario con mayor cantidad de tickets resueltos durante el último mes
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    COUNT(t.id) AS resolved_tickets_last_month
FROM tickets t
JOIN users u ON t.assigned_to = u.id
WHERE t.status = 'Cerrado'
  AND t.updated_at >= NOW() - INTERVAL '1 month'
GROUP BY u.id, u.name
ORDER BY resolved_tickets_last_month DESC
LIMIT 1;


-- 5. Obtener el tiempo promedio de resolución de tickets por prioridad
-- (Calculado desde la creación hasta su última actualización/cierre)
SELECT 
    priority,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) AS avg_resolution_hours
FROM tickets
WHERE status IN ('Resuelto', 'Cerrado')
GROUP BY priority;


-- 6. Obtener la cantidad de tickets abiertos por agente
SELECT 
    u.id AS agent_id,
    u.name AS agent_name,
    COUNT(t.id) AS open_tickets_count
FROM tickets t
JOIN users u ON t.assigned_to = u.id
WHERE t.status NOT IN ('Cerrado', 'Resuelto')
GROUP BY u.id, u.name
ORDER BY open_tickets_count DESC;


-- 7. Obtener los tickets que han sido reasignados más de dos veces
-- (Validando los cambios registrados en la tabla 'ticket_history')
SELECT 
    t.id AS ticket_id,
    t.title,
    COUNT(th.id) AS reassignments_count
FROM tickets t
JOIN ticket_history th ON t.id = th.ticket_id
WHERE th.field_changed = 'assigned_to'
GROUP BY t.id, t.title
HAVING COUNT(th.id) > 2;


-- 8. Obtener el porcentaje de tickets cerrados frente al total de tickets creados en los últimos 30 días
SELECT 
    COUNT(CASE WHEN status = 'Cerrado' THEN 1 END) AS closed_count,
    COUNT(id) AS total_created_count,
    ROUND(
        (COUNT(CASE WHEN status = 'Cerrado' THEN 1 END)::DECIMAL / NULLIF(COUNT(id), 0)) * 100, 
        2
    ) AS closed_percentage
FROM tickets
WHERE created_at >= NOW() - INTERVAL '30 days';