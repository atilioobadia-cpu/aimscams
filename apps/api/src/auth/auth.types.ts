export interface AuthBranch {
  id: string;
  code: string;
  name: string;
}

export interface AuthRole {
  code: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  mfaEnabled: boolean;
  mfaEnrollmentRequired: boolean;
  organisation: {
    id: string;
    code: string;
    name: string;
    dialect: string;
  };
  branch: AuthBranch | null;
  roles: AuthRole[];
  permissions: string[];
}

export interface AuthContext {
  sessionId: string;
  sessionExpiresAt: Date;
  user: AuthUser;
}

export interface LoginResult {
  sessionToken: string;
  csrfToken: string;
  sessionId: string;
  expiresAt: Date;
  user: AuthUser;
}

export interface MfaChallengeIssued {
  mfaRequired: true;
  challengeToken: string;
  expiresAt: Date;
}

export type LoginResponse = LoginResult | MfaChallengeIssued;

export interface MfaEnrollment {
  secret: string;
  otpauthUri: string;
  recoveryCodes: string[];
}

export interface MfaStatus {
  enabled: boolean;
  pending: boolean;
  recoveryCodesRemaining: number;
}
