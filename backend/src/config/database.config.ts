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
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER ,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Role, Area, Ticket, TicketHistory],
    autoLoadEntities: true,
    synchronize: false,
  }),
);