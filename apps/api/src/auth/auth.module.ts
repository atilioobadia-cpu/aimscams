import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuditService } from './audit.service.js';
import { CsrfGuard } from './csrf.guard.js';
import { MailService } from './mail.service.js';
import { MfaPolicyGuard } from './mfa-policy.guard.js';
import { PasswordResetService } from './password-reset.service.js';
import { PermissionsGuard } from './permissions.guard.js';
import { SessionGuard } from './session.guard.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuditService,
    MailService,
    PasswordResetService,
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: MfaPolicyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
