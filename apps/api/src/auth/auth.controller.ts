import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from './auth.constants.js';
import {
  CurrentAuth,
  Public,
  type AuthenticatedRequest,
} from './auth.decorators.js';
import { readCookie } from './auth.crypto.js';
import type { AuthContext } from './auth.types.js';

function cookieOptions(maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

function requestContext(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const email = typeof body?.email === 'string' ? body.email : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!email.trim() || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    const result = await this.authService.login(
      email,
      password,
      requestContext(request),
    );
    response.cookie(
      SESSION_COOKIE,
      result.sessionToken,
      cookieOptions(SESSION_TTL_MS),
    );
    response.cookie(CSRF_COOKIE, result.csrfToken, {
      ...cookieOptions(SESSION_TTL_MS),
      httpOnly: false,
    });

    return {
      user: result.user,
      csrfToken: result.csrfToken,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  @Get('me')
  me(@CurrentAuth() auth: AuthContext) {
    return { user: auth.user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    if (token) {
      await this.authService.logout(token, requestContext(request));
    }

    response.clearCookie(SESSION_COOKIE, cookieOptions());
    response.clearCookie(CSRF_COOKIE, { ...cookieOptions(), httpOnly: false });
    return { ok: true };
  }
}
