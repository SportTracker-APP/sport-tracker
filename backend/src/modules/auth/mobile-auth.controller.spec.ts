import { AuthService } from './auth.service';
import { MobileAuthController } from './mobile-auth.controller';

function makeController() {
  const session = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 'user-1',
      firstName: 'Camille',
      email: 'camille@example.test',
      role: 'USER',
    },
  };
  const loginMobile = jest.fn().mockResolvedValue(session);
  const logoutMobileSession = jest.fn().mockResolvedValue(undefined);
  const refreshMobileSession = jest.fn().mockResolvedValue({
    ...session,
    accessToken: 'next-access-token',
    refreshToken: 'next-refresh-token',
  });
  const authService = {
    loginMobile,
    logoutMobileSession,
    refreshMobileSession,
  };

  return {
    controller: new MobileAuthController(authService as unknown as AuthService),
    loginMobile,
    logoutMobileSession,
    refreshMobileSession,
    session,
  };
}

describe('MobileAuthController', () => {
  it('returns both tokens after a password login', async () => {
    const { controller, loginMobile, session } = makeController();

    await expect(
      controller.login({
        email: 'camille@example.test',
        password: 'secret-password',
      }),
    ).resolves.toEqual(session);
    expect(loginMobile).toHaveBeenCalledWith(
      'camille@example.test',
      'secret-password',
    );
  });

  it('rotates the supplied mobile refresh token', async () => {
    const { controller, refreshMobileSession } = makeController();

    await expect(
      controller.refresh({ refreshToken: 'refresh-token' }),
    ).resolves.toEqual(
      expect.objectContaining({
        accessToken: 'next-access-token',
        refreshToken: 'next-refresh-token',
      }),
    );
    expect(refreshMobileSession).toHaveBeenCalledWith('refresh-token');
  });

  it('revokes the supplied token on logout', async () => {
    const { controller, logoutMobileSession } = makeController();

    await expect(
      controller.logout({ refreshToken: 'refresh-token' }),
    ).resolves.toEqual({ message: 'Déconnecté' });
    expect(logoutMobileSession).toHaveBeenCalledWith('refresh-token');
  });
});
