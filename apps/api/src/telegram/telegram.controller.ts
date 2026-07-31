import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Get('login')
  async login() {
    await this.authService.login();

    return {
      success: true,
    };
  }
}