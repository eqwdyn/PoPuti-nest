import { Controller } from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { Authorization } from '../../../shared/decorators/auth.decorator.js';

@Authorization()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}
}
