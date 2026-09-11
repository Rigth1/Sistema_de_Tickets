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
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    created_by INT NOT NULL REFERENCES users(id), -- Usuario (Cliente o Agente) que abrió el ticket
    reassignment_count INT DEFAULT 0, -- Control para reasignaciones
    resolved_at TIMESTAMP, -- Requerido para métricas de tiempo de resolución
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

-- Inserción de roles base
INSERT INTO roles (name) VALUES ('Administrador'), ('Agente'), ('Supervisor');
INSERT INTO areas (name, description) VALUES ('Soporte Técnico', 'Área de soporte técnico general'), ('Ventas', 'Área de soporte para ventas y clientes'), ('Facturación', 'Área de soporte para facturación y pagos');