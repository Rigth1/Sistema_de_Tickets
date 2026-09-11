import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Role } from '../users/entities/role.entity.js';
import { Area } from '../areas/entities/area.entity.js';
import { Ticket } from '../tickets/entities/ticket.entity.js';
import { TicketHistory } from '../tickets/entities/ticket-history.entity.js';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres_user',
    password: process.env.DB_PASSWORD || 'postgres_password',
    database: process.env.DB_NAME || 'support_ticket_db',
    entities: [User, Role, Area, Ticket, TicketHistory],
    autoLoadEntities: true,
    synchronize: false,
  }),
);