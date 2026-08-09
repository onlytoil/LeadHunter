import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private databaseAvailable = false;
  private lastConnectionError: string | null = null;

  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.checkConnection();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;

      this.databaseAvailable = true;
      this.lastConnectionError = null;
      return true;
    } catch (error) {
      this.databaseAvailable = false;
      this.lastConnectionError =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'PostgreSQL is unavailable. The API will stay running and retry on the next request.',
      );

      return false;
    }
  }

  getDatabaseStatus() {
    return {
      available: this.databaseAvailable,
      lastError: this.lastConnectionError,
    };
  }
}
