import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from 'src/db';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Get the roles required for the specific handler (route)
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );

    // If no roles are required for this route, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the user object from the request (attached by your auth guard/strategy)
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User | undefined;

    // Check if the user exists and has a role
    if (!user || !user.role) {
      throw new UnauthorizedException('User role not found');
    }

    // Check if the user's single role is included in the list of required roles
    return requiredRoles.includes(user.role as Role);
  }
}
