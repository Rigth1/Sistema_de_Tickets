import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 1. Buscar al usuario por correo y cargar su relación con el rol
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { role: true },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Validar la contraseña comparando el texto con el hash guardado
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Crear el payload que viajará dentro del token JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name, // Útil para proteger rutas por roles después
    };

    // 4. Retornar el token de acceso y datos básicos del usuario
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
      },
    };
  }
}