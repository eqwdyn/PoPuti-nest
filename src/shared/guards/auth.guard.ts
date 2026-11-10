import { Injectable } from '@nestjs/common';
import { AuthGuard as PasportAuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends PasportAuthGuard('jwt') {}
