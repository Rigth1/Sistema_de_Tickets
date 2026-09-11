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
    COUNT(t.id) AS critical_tickets,
    COUNT(CASE WHEN t.priority = 'Alta' THEN 1 END) AS alta_count,
    COUNT(CASE WHEN t.priority = 'Urgente' THEN 1 END) AS urgente_count
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
-- (Optimizado usando la nueva columna automatizada 'resolved_at')
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    COUNT(t.id) AS resolved_tickets_last_month
FROM tickets t
JOIN users u ON t.assigned_to = u.id
WHERE t.status IN ('Cerrado', 'Resuelto')
  AND t.resolved_at >= NOW() - INTERVAL '1 month'
GROUP BY u.id, u.name
ORDER BY resolved_tickets_last_month DESC
LIMIT 1;


-- 5. Obtener el tiempo promedio de resolución de tickets por prioridad
-- (Ahora usa 'resolved_at' de forma exacta en lugar de 'updated_at')
SELECT 
    priority,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) AS avg_resolution_hours
FROM tickets
WHERE status IN ('Resuelto', 'Cerrado')
  AND resolved_at IS NOT NULL
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
-- (Opción ultra rápida aprovechando la columna de control 'reassignment_count')
SELECT 
    id AS ticket_id,
    title,
    reassignment_count
FROM tickets
WHERE reassignment_count > 2;


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