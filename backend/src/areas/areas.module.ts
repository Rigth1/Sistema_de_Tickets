import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreasService } from './areas.service.js';
import { AreasController } from './areas.controller.js';
import { Area } from './entities/area.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Area])],
  controllers: [AreasController],
  providers: [AreasService],
  exports: [AreasService],
})
export class AreasModule {}