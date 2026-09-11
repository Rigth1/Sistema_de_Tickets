import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';
import { Ticket } from '../tickets/entities/ticket.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}