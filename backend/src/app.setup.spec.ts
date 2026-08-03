import { isCorsOriginAllowed } from './app.setup';

describe('CORS origin validation', () => {
  const productionOrigin = 'https://hovren.fr';
  const allowedOrigins = new Set([productionOrigin]);

  it('accepts requests without an Origin header', () => {
    expect(isCorsOriginAllowed(undefined, allowedOrigins, true)).toBe(true);
  });

  it('normalizes a configured origin before comparing it', () => {
    expect(
      isCorsOriginAllowed('https://hovren.fr/', allowedOrigins, true),
    ).toBe(true);
  });

  it.each([
    'http://localhost:3000',
    'http://localhost:3007',
    'http://127.0.0.1:3000',
    'http://[::1]:3000',
  ])('accepts the local origin %s outside production', (origin) => {
    expect(isCorsOriginAllowed(origin, allowedOrigins, false)).toBe(true);
  });

  it('rejects an unconfigured remote origin outside production', () => {
    expect(
      isCorsOriginAllowed('https://malicious.example', allowedOrigins, false),
    ).toBe(false);
  });

  it.each([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://malicious.example',
  ])('rejects the unconfigured origin %s in production', (origin) => {
    expect(isCorsOriginAllowed(origin, allowedOrigins, true)).toBe(false);
  });
});
