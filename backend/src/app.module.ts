import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { AreasModule } from './areas/areas.module.js';
import { UsersModule } from './users/users.module.js';
import { ReportsModule } from './reports/reports.module.js';
import databaseConfig from './config/database.config.js';

@Module({
  imports: [
    // 1. Configuración de variables de entorno
    ConfigModule.forRoot({ 
      isGlobal: true,
      load: [databaseConfig], // Cargar la configuración de la base de datos desde un archivo externo
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database') as TypeOrmModuleOptions,
      inject: [ConfigService],
    }),
    AuthModule,
    TicketsModule,
    AreasModule,
    UsersModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}