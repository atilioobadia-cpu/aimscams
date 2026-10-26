export type AuthBranch = {
  id: string;
  code: string;
  name: string;
};

export type AuthRole = {
  code: string;
  name: string;
};

export type AuthUser = {
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
};

export type MfaStatus = {
  enabled: boolean;
  pending: boolean;
  recoveryCodesRemaining: number;
};

export type MfaEnrollment = {
  secret: string;
  otpauthUri: string;
  recoveryCodes: string[];
};
