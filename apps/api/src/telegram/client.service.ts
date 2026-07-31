import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

@Injectable()
export class ClientService {
  private client: TelegramClient;

  constructor(private readonly configService: ConfigService) {
    const apiId = Number(this.configService.get('TELEGRAM_API_ID'));
    const apiHash = this.configService.get<string>('TELEGRAM_API_HASH')!;

    const session = this.configService.get<string>('TELEGRAM_SESSION') ?? '';

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
    return this.client;
  }

  async connect() {
  await this.client.connect();
  }
}