import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'jwt_key_change_pruebas',
    });
  }

  async validate(payload: any) {
    // Lo que retornemos aquí se inyectará automáticamente en el objeto `request.user` de las rutas protegidas
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}