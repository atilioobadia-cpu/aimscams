import {
  createParamDecorator,
  SetMetadata,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthContext } from './auth.types.js';

export const IS_PUBLIC_KEY = 'aimscams:isPublic';
export const PERMISSIONS_KEY = 'aimscams:permissions';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
}

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.auth) {
      throw new UnauthorizedException('Authentication required.');
    }
    return request.auth;
  },
);
