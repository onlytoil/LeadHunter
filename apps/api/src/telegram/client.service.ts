import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions';

@Injectable()
export class ClientService implements OnApplicationShutdown {
  private readonly client: TelegramClient | null;
  private connectPromise: Promise<void> | null = null;
  private isShuttingDown = false;

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
      { connectionRetries: 0 },
    );
  }

  getClient(): TelegramClient {
    if (!this.client) {
      throw new Error('Telegram integration is disabled');
    }

    return this.client;
  }

  async connect(): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Telegram client is shutting down');
    }

    if (this.isConnected()) {
      return;
    }

    if (!this.connectPromise) {
      this.connectPromise = this.connectInternal().finally(() => {
        this.connectPromise = null;
      });
    }

    return this.connectPromise;
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  async disconnect(): Promise<void> {
    if (this.client?.connected) {
      await this.client.disconnect();
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.isShuttingDown = true;
    await this.disconnect();
  }

  private async connectInternal(): Promise<void> {
    const client = this.getClient();

    await client.connect();

    if (this.isShuttingDown) {
      await this.disconnect();
      throw new Error('Telegram client is shutting down');
    }

    if (!(await client.checkAuthorization())) {
      await this.disconnect();

      throw new Error(
        'TELEGRAM_SESSION is not authorized. Run `pnpm telegram:login` first.',
      );
    }
  }
}
