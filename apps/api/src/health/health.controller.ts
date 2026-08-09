import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    const databaseAvailable = await this.prisma.checkConnection();

    if (!databaseAvailable) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        database: this.prisma.getDatabaseStatus(),
      });
    }

    return {
      status: 'ok',
      database: this.prisma.getDatabaseStatus(),
    };
  }
}
