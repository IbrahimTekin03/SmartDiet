import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();

    // JwtAuthGuard başarısızsa zaten 401 atar; buraya gelmişse kullanıcı doğrulanmıştır.
    // Rol bilgisi yoksa veya boşsa 403 dön.
    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }

    const hasRole = requiredRoles.some((role) =>
      user.roles.some((userRole) => userRole.name === role),
    );

    if (!hasRole) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }

    return true;
  }
} 