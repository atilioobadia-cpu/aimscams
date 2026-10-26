import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.decorators.js';
import { isMfaPolicyExemptPath } from './mfa-policy.js';

@Injectable()
export class MfaPolicyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.auth || isMfaPolicyExemptPath(request.path)) {
      return true;
    }

    if (request.auth.user.mfaEnrollmentRequired) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Multi-factor authentication enrolment is required.',
        code: 'MFA_ENROLLMENT_REQUIRED',
      });
    }

    return true;
  }
}
