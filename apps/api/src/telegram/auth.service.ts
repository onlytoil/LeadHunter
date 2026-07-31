import { Injectable } from '@nestjs/common';
import { ClientService } from './client.service';

import input from 'input';

@Injectable()
export class AuthService {
  constructor(
    private readonly clientService: ClientService,
  ) {}

  async login() {
    const client = this.clientService.getClient();

    await client.start({
      phoneNumber: async () => await input.text('Телефон: '),

      password: async () => await input.text('Пароль 2FA: '),

      phoneCode: async () => await input.text('Код из Telegram: '),

      onError: (err) => console.error(err),
    });

    console.log('Успешная авторизация!');
  }
}