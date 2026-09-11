import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findAll(): Promise<User[]> {
        return await this.userRepository.find({
            relations: {
                role: true,
                areas: true
            }, // Traemos el rol y las áreas asociadas desde la entidad
        });
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: {
                role: true,
                areas: true
            },
        });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return user;
    }
}