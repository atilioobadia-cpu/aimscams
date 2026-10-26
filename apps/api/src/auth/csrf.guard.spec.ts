import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard.js';

function context(input: {
  method?: string;
  cookie?: string;
  csrfHeader?: string;
}): ExecutionContext {
  const request = {
    method: input.method ?? 'POST',
    headers: {
      ...(input.cookie === undefined ? {} : { cookie: input.cookie }),
      ...(input.csrfHeader === undefined
        ? {}
        : { 'x-csrf-token': input.csrfHeader }),
    },
  };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

function guardFor(isPublic: boolean): CsrfGuard {
  const reflector = {
    getAllAndOverride: () => isPublic,
  } as unknown as Reflector;
  return new CsrfGuard(reflector);
}

describe('CsrfGuard', () => {
  const guard = guardFor(false);

  it('allows safe methods without a token', () => {
    expect(guard.canActivate(context({ method: 'GET' }))).toBe(true);
  });

  it('allows public routes even with a stale session cookie', () => {
    expect(
      guardFor(true).canActivate(
        context({ cookie: 'aimscams_session=stale-token' }),
      ),
    ).toBe(true);
  });

  it('allows mutations before a session exists', () => {
    expect(guard.canActivate(context({}))).toBe(true);
  });

  it('requires a matching header for session-bearing mutations', () => {
    expect(() =>
      guard.canActivate(context({ cookie: 'aimscams_session=session-token' })),
    ).toThrow(ForbiddenException);

    expect(() =>
      guard.canActivate(
        context({
          cookie: 'aimscams_session=session-token; aimscams_csrf=csrf-token',
          csrfHeader: 'different-token',
        }),
      ),
    ).toThrow(ForbiddenException);

    expect(
      guard.canActivate(
        context({
          cookie: 'aimscams_session=session-token; aimscams_csrf=csrf-token',
          csrfHeader: 'csrf-token',
        }),
      ),
    ).toBe(true);
  });
});
