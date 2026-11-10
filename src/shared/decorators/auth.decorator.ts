import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard.js';

export function Authorization() {
  return applyDecorators(UseGuards(AuthGuard));
}
