import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { PasswordResetService } from './password-reset.service.js';
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
import type { AuthContext, LoginResult } from './auth.types.js';

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

function requiredString(
  body: Record<string, unknown>,
  field: string,
  message: string,
): string {
  const value = body?.[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(message);
  }
  return value.trim();
}

function setSessionCookies(response: Response, result: LoginResult): void {
  response.cookie(
    SESSION_COOKIE,
    result.sessionToken,
    cookieOptions(SESSION_TTL_MS),
  );
  response.cookie(CSRF_COOKIE, result.csrfToken, {
    ...cookieOptions(SESSION_TTL_MS),
    httpOnly: false,
  });
}

function loginPayload(result: LoginResult) {
  return {
    user: result.user,
    csrfToken: result.csrfToken,
    expiresAt: result.expiresAt.toISOString(),
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

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
    response.setHeader('Cache-Control', 'no-store');

    if ('mfaRequired' in result) {
      return {
        mfaRequired: true,
        challengeToken: result.challengeToken,
        expiresAt: result.expiresAt.toISOString(),
      };
    }

    setSessionCookies(response, result);
    return loginPayload(result);
  }

  @Public()
  @Post('password-reset/request')
  @Header('Cache-Control', 'no-store')
  @HttpCode(202)
  async requestPasswordReset(
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!email) {
      throw new BadRequestException('Email is required.');
    }

    const result = await this.passwordReset.request(
      email,
      requestContext(request),
    );
    return {
      requested: true,
      message:
        'If an account exists for that email, a password reset link has been sent.',
      ...result,
    };
  }

  @Public()
  @Post('password-reset/confirm')
  @Header('Cache-Control', 'no-store')
  @HttpCode(200)
  async confirmPasswordReset(
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const token = requiredString(
      body,
      'token',
      'A password reset token is required.',
    );
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!password) {
      throw new BadRequestException('A new password is required.');
    }

    await this.passwordReset.confirm(token, password, requestContext(request));
    return { ok: true };
  }

  @Public()
  @Post('mfa/challenge')
  @HttpCode(200)
  async completeMfaChallenge(
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const challengeToken = requiredString(
      body,
      'challengeToken',
      'An authentication challenge is required.',
    );
    const code = requiredString(
      body,
      'code',
      'An authentication code is required.',
    );

    const result = await this.authService.completeMfaChallenge(
      challengeToken,
      code,
      requestContext(request),
    );
    setSessionCookies(response, result);
    response.setHeader('Cache-Control', 'no-store');
    return loginPayload(result);
  }

  @Get('me')
  me(@CurrentAuth() auth: AuthContext) {
    return { user: auth.user };
  }

  @Get('mfa/status')
  async mfaStatus(@CurrentAuth() auth: AuthContext) {
    return this.authService.getMfaStatus(auth.user.id);
  }

  @Post('mfa/enroll')
  @HttpCode(200)
  async enrollMfa(@CurrentAuth() auth: AuthContext, @Req() request: Request) {
    return this.authService.enrollMfa(auth.user.id, requestContext(request));
  }

  @Post('mfa/activate')
  @HttpCode(200)
  async activateMfa(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const code = requiredString(
      body,
      'code',
      'An authentication code is required.',
    );
    await this.authService.activateMfa(
      auth.user.id,
      auth.sessionId,
      code,
      requestContext(request),
    );
    return { ok: true, mfaEnabled: true };
  }

  @Post('mfa/recovery-codes')
  @HttpCode(200)
  async regenerateRecoveryCodes(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const password = requiredString(
      body,
      'password',
      'Your password is required.',
    );
    const code = requiredString(
      body,
      'code',
      'An authentication code is required.',
    );
    const recoveryCodes = await this.authService.regenerateRecoveryCodes(
      auth.user.id,
      password,
      code,
      requestContext(request),
    );
    return { recoveryCodes };
  }

  @Post('mfa/disable')
  @HttpCode(200)
  async disableMfa(
    @CurrentAuth() auth: AuthContext,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const password = requiredString(
      body,
      'password',
      'Your password is required.',
    );
    const code = requiredString(
      body,
      'code',
      'An authentication code is required.',
    );
    await this.authService.disableMfa(
      auth.user.id,
      auth.sessionId,
      password,
      code,
      requestContext(request),
    );
    return { ok: true, mfaEnabled: false };
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
