import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { TicketsModule } from './tickets/tickets.module.js';

@Module({
  imports: [
    // 1. Configuración de variables de entorno
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. Configuración asíncrona de TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        // Configuración de la conexión a la base de datos usando variables de entorno y valores por defecto para desarrollo local
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres_user'),
        password: configService.get<string>('DB_PASSWORD', 'postgres_password'),
        database: configService.get<string>('DB_NAME', 'support_ticket_db'),
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),

    // 3. modulos de la aplicación
    AuthModule,
    TicketsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}