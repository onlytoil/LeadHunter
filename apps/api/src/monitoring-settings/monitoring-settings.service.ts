import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MonitoringSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const [chats, keywordRules] = await Promise.all([
      this.prisma.monitoredChat.findMany({
        orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
      }),
      this.prisma.keywordRule.findMany({
        orderBy: [{ type: 'asc' }, { active: 'desc' }, { createdAt: 'asc' }],
      }),
    ]);

    return { chats, keywordRules };
  }
}