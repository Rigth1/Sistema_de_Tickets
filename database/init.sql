-- Creación de Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- 'Administrador', 'Agente', 'Supervisor'
);

-- Creación de Áreas / Colas
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Creación de Usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Pivote: Usuarios <-> Áreas (Soporte para múltiples áreas por agente/supervisor)
CREATE TABLE user_areas (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    area_id INT REFERENCES areas(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, area_id)
);

-- Creación de Tickets (Ajustado sin la tabla clients)
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Abierto', -- 'Abierto', 'En_Progreso', 'Resuelto', 'Cerrado'
    priority VARCHAR(50) NOT NULL DEFAULT 'Media', -- 'Bajo', 'Medio', 'Alto', 'Critico'
    area_id INT NOT NULL REFERENCES areas(id),
    affected_user INT REFERENCES users(id) ON DELETE SET NULL, -- Usuario real afectado (Cliente)
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,     -- Agente responsable
    created_by INT NOT NULL REFERENCES users(id),               -- Usuario que abrió el registro en el sistema
    reassignment_count INT DEFAULT 0,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de Comentarios (incluye notas internas)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de la tabla de Historial / Trazabilidad de Tickets (Alineada con la lógica de NestJS)
CREATE TABLE ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    changed_by INT REFERENCES users(id) ON DELETE SET NULL, -- Coincide con el servicio (antes user_id)
    field_changed VARCHAR(100),                              -- Coincide con el servicio (antes action_type)
    old_value TEXT,                                          -- Valor anterior del cambio
    new_value TEXT,                                          -- Nuevo valor del cambio
    action_description TEXT NOT NULL,                        -- Coincide con el servicio (antes description)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Índices esenciales para evitar lentitud cuando crezca el Historial y los Tickets
CREATE INDEX idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_created_at ON ticket_history(created_at);

-- 2. Índices en la tabla tickets para que los filtros por estado, área o cliente vuelen
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_area_id ON tickets(area_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_affected_user ON tickets(affected_user);

-- Inserción de roles base
INSERT INTO roles (name) VALUES ('Administrador'), ('Agente'), ('Cliente'), ('Supervisor');
INSERT INTO areas (name, description) VALUES ('Soporte Técnico', 'Área de soporte técnico general'), ('Ventas', 'Área de soporte para ventas y clientes'), ('Facturación', 'Área de soporte para facturación y pagos');
-- Insertar usuarios de prueba (Asumiendo que 1=Admin, 2=Agente, 3=Cliente, 4=Supervisor)
-- Nota: El hash de abajo corresponde a la contraseña "123456" en bcrypt.
INSERT INTO users (name, email, password_hash, role_id) VALUES 
('Ana Administradora', 'admin@sistema.com', '$2b$10$uOICjrog/XWwPPOlexHzIeEjMyErrECBekwtHIyJhgw/eSFCUg996', 1),
('Carlos Agente', 'agente@sistema.com', '$2b$10$uOICjrog/XWwPPOlexHzIeEjMyErrECBekwtHIyJhgw/eSFCUg996', 2),
('Juan Cliente', 'cliente@sistema.com', '$2b$10$uOICjrog/XWwPPOlexHzIeEjMyErrECBekwtHIyJhgw/eSFCUg996', 3),
('Sofia Supervisor', 'supervisor@sistema.com', '$2b$10$uOICjrog/XWwPPOlexHzIeEjMyErrECBekwtHIyJhgw/eSFCUg996', 4);

-- INSERTS DE DATOS SIMULADOS
DO $$
DECLARE
    v_i INT;
    v_random_status TEXT;
    v_created_timestamp TIMESTAMP;
    v_updated_timestamp TIMESTAMP;
BEGIN
    -- 1. Inserción de 50 Tickets de prueba
    FOR v_i IN 1..50 LOOP
        -- Haremos que los primeros 15 tickets estén "estancados" (>48 horas sin actualizar y abiertos/en progreso)
        IF v_i <= 15 THEN
            v_random_status := (ARRAY['Abierto', 'En Progreso'])[floor(random() * 2 + 1)];
            -- Fecha de creación/actualización de 3 a 10 días atrás (supera las 48h)
            v_created_timestamp := CURRENT_TIMESTAMP - ((random() * 7 + 3) * interval '1 days');
            v_updated_timestamp := v_created_timestamp; 
        ELSE
            -- El resto de tickets tendrán fechas recientes y estados variados
            v_random_status := (ARRAY['Abierto', 'En Progreso', 'Resuelto', 'Cerrado'])[floor(random() * 4 + 1)];
            v_created_timestamp := CURRENT_TIMESTAMP - (random() * interval '2 days');
            v_updated_timestamp := CURRENT_TIMESTAMP;
        END IF;

        INSERT INTO tickets (
            title, 
            description, 
            status, 
            priority, 
            area_id, 
            affected_user, 
            assigned_to, 
            created_by, 
            reassignment_count, 
            resolved_at,
            created_at,
            updated_at
        ) VALUES (
            'Falla en sistema operativo y software de gestión #' || v_i,
            'Descripción detallada del incidente reportado por el usuario corporativo número ' || v_i || '. Requiere revisión técnica.',
            v_random_status,
            -- CORREGIDO: Usando 'Alto' y 'Critico' para que coincida con la consulta #2 y el esquema
            (ARRAY['Bajo', 'Medio', 'Alto', 'Critico'])[floor(random() * 4 + 1)],
            floor(random() * 3 + 1)::INT, -- IDs de áreas: 1, 2 o 3
            floor(random() * 4 + 1)::INT, -- IDs de usuarios: 1 al 4
            floor(random() * 4 + 1)::INT,
            floor(random() * 4 + 1)::INT,
            floor(random() * 3)::INT,     -- Conteo de reasignaciones (0 a 2)
            CASE WHEN v_random_status = 'Resuelto' OR v_random_status = 'Cerrado' THEN v_created_timestamp + interval '1 days' ELSE NULL END,
            v_created_timestamp,
            v_updated_timestamp
        );
    END LOOP;

    -- 2. Inserción de 100 Comentarios
    FOR v_i IN 1..100 LOOP
        INSERT INTO comments (
            ticket_id, 
            user_id, 
            content, 
            is_internal
        ) VALUES (
            floor(random() * 50 + 1)::INT, -- Asocia a un ticket aleatorio del 1 al 50
            floor(random() * 4 + 1)::INT,  -- Usuario aleatorio del 1 al 4
            'Este es un comentario de seguimiento automático #' || v_i || ' para evaluar el flujo de la aplicación.',
            (random() > 0.7)               -- 30% de probabilidad de que sea nota interna
        );
    END LOOP;

    -- 3. Inserción de 200 Acciones de Historial (ticket_history)
    FOR v_i IN 1..200 LOOP
        INSERT INTO ticket_history (
            ticket_id, 
            changed_by, 
            field_changed, 
            old_value, 
            new_value, 
            action_description
        ) VALUES (
            floor(random() * 50 + 1)::INT,
            floor(random() * 4 + 1)::INT,
            (ARRAY['status', 'priority', 'assigned_to', 'title'])[floor(random() * 4 + 1)],
            'Valor previo',
            'Nuevo valor actualizado',
            'Acción de trazabilidad registrada automáticamente en el sistema #' || v_i
        );
    END LOOP;
END $$;