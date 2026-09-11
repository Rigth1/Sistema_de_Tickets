import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtiene los roles requeridos definidos en el decorador de la ruta o controlador
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene el decorador @Roles, se permite el paso por defecto
    if (!requiredRoles) {
      return true;
    }

    // 2. Extrae el usuario autenticado que dejó la estrategia JWT en la petición
    const { user } = context.switchToHttp().getRequest();

    // 3. Valida si el rol del usuario coincide con alguno de los permitidos
    return requiredRoles.some((role) => user.role === role);
  }
}