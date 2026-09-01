import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../authenticated-request.type';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!data) {
      return user;
    }

    return data in user ? user[data as keyof typeof user] : undefined;
  },
);
