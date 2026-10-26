import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { MfaPolicyGuard } from './mfa-policy.guard.js';
import { isMfaPolicyExemptPath, requiresMfaEnrollment } from './mfa-policy.js';

const baseSubject = {
  mfaEnabled: false,
  roles: [{ code: 'TELLER' }],
  permissions: ['Client : View'],
};

describe('MFA policy', () => {
  it('requires MFA for privileged roles', () => {
    for (const code of ['ADMIN', 'MANAGING_DIRECTOR', 'ACCOUNTANT']) {
      expect(
        requiresMfaEnrollment({
          ...baseSubject,
          roles: [{ code }],
        }),
      ).toBe(true);
    }
  });

  it('requires MFA for approvers regardless of role name', () => {
    expect(
      requiresMfaEnrollment({
        ...baseSubject,
        roles: [{ code: 'BRANCH_MANAGER' }],
        permissions: ['Loan Account : Approve'],
      }),
    ).toBe(true);
    expect(
      requiresMfaEnrollment({
        ...baseSubject,
        permissions: ['Transaction : Reversal Approval'],
      }),
    ).toBe(true);
  });

  it('does not require MFA for tellers or already-enrolled users', () => {
    expect(requiresMfaEnrollment(baseSubject)).toBe(false);
    expect(
      requiresMfaEnrollment({
        ...baseSubject,
        mfaEnabled: true,
        roles: [{ code: 'ADMIN' }],
      }),
    ).toBe(false);
  });

  it('exempts the enrolment and session routes', () => {
    expect(isMfaPolicyExemptPath('/auth/me')).toBe(true);
    expect(isMfaPolicyExemptPath('/auth/logout')).toBe(true);
    expect(isMfaPolicyExemptPath('/auth/mfa/status')).toBe(true);
    expect(isMfaPolicyExemptPath('/auth/mfa/enroll')).toBe(true);
    expect(isMfaPolicyExemptPath('/clients')).toBe(false);
    expect(isMfaPolicyExemptPath('/auth/mfa-other')).toBe(false);
  });
});

describe('MfaPolicyGuard', () => {
  const guard = new MfaPolicyGuard();

  function context(
    path: string,
    mfaEnrollmentRequired: boolean,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          path,
          auth: {
            user: {
              mfaEnrollmentRequired,
            },
          },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows exempt routes even when enrolment is pending', () => {
    expect(guard.canActivate(context('/auth/mfa/enroll', true))).toBe(true);
  });

  it('blocks business routes while enrolment is pending', () => {
    expect(() => guard.canActivate(context('/clients', true))).toThrow(
      ForbiddenException,
    );
  });

  it('allows business routes after enrolment', () => {
    expect(guard.canActivate(context('/clients', false))).toBe(true);
  });
});
