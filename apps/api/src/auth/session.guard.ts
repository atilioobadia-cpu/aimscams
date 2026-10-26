import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { readCookie } from './auth.crypto.js';
import { IS_PUBLIC_KEY, type AuthenticatedRequest } from './auth.decorators.js';
import { SESSION_COOKIE } from './auth.constants.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    if (!token) {
      throw new UnauthorizedException('Authentication required.');
    }

    const auth = await this.authService.getSession(token);
    if (!auth) {
      throw new UnauthorizedException(
        'Your session has expired. Sign in again.',
      );
    }

    request.auth = auth;
    return true;
  }
}
