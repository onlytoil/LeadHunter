import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

@Injectable()
export class ClientService implements OnApplicationShutdown {
  private readonly client: TelegramClient | null;

  constructor(private readonly configService: ConfigService) {
    if (!this.configService.get<boolean>('TELEGRAM_ENABLED', false)) {
      this.client = null;
      return;
    }

    const apiId = this.configService.getOrThrow<number>('TELEGRAM_API_ID');
    const apiHash = this.configService.getOrThrow<string>('TELEGRAM_API_HASH');

    const session = this.configService.getOrThrow<string>('TELEGRAM_SESSION');

    this.client = new TelegramClient(
      new StringSession(session),
      apiId,
      apiHash,
      {
        connectionRetries: 5,
      },
    );
  }

  getClient() {
    if (!this.client) {
      throw new Error('Telegram integration is disabled');
    }

    return this.client;
  }

  async connect() {
    const client = this.getClient();
    await client.connect();

    if (!(await client.checkAuthorization())) {
      await client.disconnect();
      throw new Error(
        'TELEGRAM_SESSION is not authorized. Run `pnpm telegram:login` first.',
      );
    }
  }

  async onApplicationShutdown() {
    if (this.client?.connected) {
      await this.client.disconnect();
    }
  }
}
