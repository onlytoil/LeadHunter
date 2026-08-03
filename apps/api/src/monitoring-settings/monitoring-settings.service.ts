import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

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
    return this.executeMutation(
      () =>
        this.prisma.monitoredChat.create({
          data: {
            identifier: dto.identifier,
            title: dto.title,
            active: dto.active,
          },
        }),
      'Monitored chat',
    );
  }

  createKeywordRule(dto: CreateKeywordRuleDto) {
    return this.executeMutation(
      () =>
        this.prisma.keywordRule.create({
          data: {
            phrase: dto.phrase,
            type: dto.type,
            active: dto.active,
          },
        }),
      'Keyword rule',
    );
  }

  updateChatActive(id: string, dto: UpdateActiveDto) {
    return this.executeMutation(
      () =>
        this.prisma.monitoredChat.update({
          where: { id },
          data: { active: dto.active },
        }),
      'Monitored chat',
    );
  }

  updateKeywordRuleActive(id: string, dto: UpdateActiveDto) {
    return this.executeMutation(
      () =>
        this.prisma.keywordRule.update({
          where: { id },
          data: { active: dto.active },
        }),
      'Keyword rule',
    );
  }

  updateChat(id: string, dto: UpdateMonitoredChatDto) {
    return this.executeMutation(
      () =>
        this.prisma.monitoredChat.update({
          where: { id },
          data: {
            identifier: dto.identifier,
            title: dto.title,
          },
        }),
      'Monitored chat',
    );
  }

  updateKeywordRule(id: string, dto: UpdateKeywordRuleDto) {
    return this.executeMutation(
      () =>
        this.prisma.keywordRule.update({
          where: { id },
          data: {
            phrase: dto.phrase,
            type: dto.type,
          },
        }),
      'Keyword rule',
    );
  }

  deleteChat(id: string) {
    return this.executeMutation(
      () =>
        this.prisma.monitoredChat.delete({
          where: { id },
        }),
      'Monitored chat',
    );
  }

  deleteKeywordRule(id: string) {
    return this.executeMutation(
      () =>
        this.prisma.keywordRule.delete({
          where: { id },
        }),
      'Keyword rule',
    );
  }

  private async executeMutation<T>(
    operation: () => Promise<T>,
    resourceName: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`${resourceName} already exists`);
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(`${resourceName} not found`);
        }
      }

      throw error;
    }
  }
}
