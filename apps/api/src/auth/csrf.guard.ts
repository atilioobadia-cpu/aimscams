import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './auth.decorators.js';
import { CSRF_COOKIE, SESSION_COOKIE } from './auth.constants.js';
import { constantTimeEqual, readCookie } from './auth.crypto.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    // Public routes authenticate with credentials or a one-time challenge
    // token, not the ambient session. A stale session cookie must not make
    // login or the MFA challenge unreachable.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Once a session exists, every mutating request must echo the
    // non-httpOnly CSRF cookie in a header.
    if (!readCookie(request.headers.cookie, SESSION_COOKIE)) {
      return true;
    }

    const cookieToken = readCookie(request.headers.cookie, CSRF_COOKIE);
    const headerValue = request.headers['x-csrf-token'];
    const headerToken = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (
      !cookieToken ||
      !headerToken ||
      !constantTimeEqual(cookieToken, headerToken)
    ) {
      throw new ForbiddenException('Invalid or missing CSRF token.');
    }

    return true;
  }
}
