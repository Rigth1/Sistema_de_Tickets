import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './entities/area.entity.js';
import { CreateAreaDto } from './dto/create-area.dto.js';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
  ) {}

  async create(createAreaDto: CreateAreaDto): Promise<Area> {
    const existingArea = await this.areaRepository.findOne({
      where: { name: createAreaDto.name },
    });

    if (existingArea) {
      throw new ConflictException('Ya existe un área con ese nombre');
    }

    const area = this.areaRepository.create(createAreaDto);
    return await this.areaRepository.save(area);
  }

  async findAll(): Promise<Area[]> {
    return await this.areaRepository.find();
  }
}