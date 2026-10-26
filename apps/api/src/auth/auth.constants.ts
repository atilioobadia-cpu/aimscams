export const SESSION_COOKIE = 'aimscams_session';
export const CSRF_COOKIE = 'aimscams_csrf';

export const SESSION_TTL_MS = 8 * 60 * 60 * 1_000;
export const LAST_SEEN_UPDATE_MS = 5 * 60 * 1_000;
export const LOGIN_WINDOW_MS = 10 * 60 * 1_000;
export const MAX_FAILED_LOGINS = 5;
export const MAX_FAILED_LOGINS_PER_IP = 20;
export const LOCKOUT_MS = 15 * 60 * 1_000;
export const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1_000;
export const MFA_RECOVERY_CODE_COUNT = 10;

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1_000;
export const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1_000;
export const PASSWORD_RESET_MAX_PER_USER = 5;
export const PASSWORD_RESET_MAX_PER_IP = 10;
