import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SafeUser } from '../types/safeUser.js';

export const Authorized = createParamDecorator(
  (data: keyof SafeUser, ctx: ExecutionContext) => {
    let user: SafeUser;

    user = ctx.switchToHttp().getRequest().user;

    return data ? user[data] : user;
  },
);
