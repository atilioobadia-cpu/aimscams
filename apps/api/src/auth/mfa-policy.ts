const MFA_REQUIRED_ROLE_CODES = new Set([
  'ADMIN',
  'MANAGING_DIRECTOR',
  'ACCOUNTANT',
]);

const MFA_REQUIRED_PERMISSION_SUFFIXES = [
  ' : Approve',
  ' : Reject',
  ' : Reversal Approval',
] as const;

export interface MfaPolicySubject {
  mfaEnabled: boolean;
  roles: Array<{ code: string }>;
  permissions: string[];
}

export function requiresMfaEnrollment(subject: MfaPolicySubject): boolean {
  if (subject.mfaEnabled) {
    return false;
  }

  return (
    subject.roles.some((role) => MFA_REQUIRED_ROLE_CODES.has(role.code)) ||
    subject.permissions.some((permission) =>
      MFA_REQUIRED_PERMISSION_SUFFIXES.some((suffix) =>
        permission.endsWith(suffix),
      ),
    )
  );
}

export function isMfaPolicyExemptPath(path: string): boolean {
  return (
    path === '/auth/me' ||
    path === '/auth/logout' ||
    path === '/auth/mfa' ||
    path.startsWith('/auth/mfa/')
  );
}
