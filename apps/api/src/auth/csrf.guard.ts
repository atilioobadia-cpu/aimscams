import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { CSRF_COOKIE, SESSION_COOKIE } from './auth.constants.js';
import { constantTimeEqual, readCookie } from './auth.crypto.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    // A login request has no authenticated cookie yet. Once a session exists,
    // every mutating request must echo the non-httpOnly CSRF cookie in a header.
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
