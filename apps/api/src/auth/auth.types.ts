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
  expiresAt: Date;
  user: AuthUser;
}
