import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateKeywordRuleDto } from './dto/create-keyword-rule.dto';
import { CreateMonitoredChatDto } from './dto/create-monitored-chat.dto';
import { UpdateActiveDto } from './dto/update-active.dto';
import { UpdateKeywordRuleDto } from './dto/update-keyword-rule.dto';
import { UpdateMonitoredChatDto } from './dto/update-monitored-chat.dto';

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

  createChat(dto: CreateMonitoredChatDto) {
    return this.prisma.monitoredChat.create({
      data: {
        identifier: dto.identifier,
        title: dto.title,
        active: dto.active,
      },
    });
  }

  createKeywordRule(dto: CreateKeywordRuleDto) {
    return this.prisma.keywordRule.create({
      data: {
        phrase: dto.phrase,
        type: dto.type,
        active: dto.active,
      },
    });
  }

  updateChatActive(id: string, dto: UpdateActiveDto) {
    return this.prisma.monitoredChat.update({
      where: { id },
      data: { active: dto.active },
    });
  }

  updateKeywordRuleActive(id: string, dto: UpdateActiveDto) {
    return this.prisma.keywordRule.update({
      where: { id },
      data: { active: dto.active },
    });
  }

  updateChat(id: string, dto: UpdateMonitoredChatDto) {
    return this.prisma.monitoredChat.update({
      where: { id },
      data: {
        identifier: dto.identifier,
        title: dto.title,
      },
    });
  }

  updateKeywordRule(id: string, dto: UpdateKeywordRuleDto) {
    return this.prisma.keywordRule.update({
      where: { id },
      data: {
        phrase: dto.phrase,
        type: dto.type,
      },
    });
  }

  deleteChat(id: string) {
    return this.prisma.monitoredChat.delete({
      where: { id },
    });
  }

  deleteKeywordRule(id: string) {
    return this.prisma.keywordRule.delete({
      where: { id },
    });
  }
}