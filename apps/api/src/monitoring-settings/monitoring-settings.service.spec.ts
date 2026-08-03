import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { MonitoringSettingsService } from './monitoring-settings.service';

describe('MonitoringSettingsService', () => {
  const prisma = {
    monitoredChat: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    keywordRule: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const service = new MonitoringSettingsService(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createPrismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('Prisma request failed', {
      code,
      clientVersion: '7.9.0',
    });

  it('returns monitored chats and keyword rules', async () => {
    const chats = [{ id: 'chat-1', identifier: '@example', active: true }];
    const keywordRules = [
      {
        id: 'rule-1',
        phrase: 'нужен сайт',
        type: 'INCLUDE',
        active: true,
      },
    ];

    prisma.monitoredChat.findMany.mockResolvedValue(chats);
    prisma.keywordRule.findMany.mockResolvedValue(keywordRules);

    await expect(service.getAll()).resolves.toEqual({
      chats,
      keywordRules,
    });

    expect(prisma.monitoredChat.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.keywordRule.findMany).toHaveBeenCalledTimes(1);
  });

  it('creates a monitored chat', async () => {
    const dto = {
      identifier: '@example',
      title: 'Example chat',
      active: true,
    };
    const createdChat = { id: 'chat-1', ...dto };

    prisma.monitoredChat.create.mockResolvedValue(createdChat);

    await expect(service.createChat(dto)).resolves.toEqual(createdChat);

    expect(prisma.monitoredChat.create).toHaveBeenCalledWith({
      data: dto,
    });
  });

  it('creates a keyword rule', async () => {
    const dto = {
      phrase: 'нужен сайт',
      type: 'INCLUDE' as const,
      active: true,
    };
    const createdRule = { id: 'rule-1', ...dto };

    prisma.keywordRule.create.mockResolvedValue(createdRule);

    await expect(service.createKeywordRule(dto)).resolves.toEqual(createdRule);

    expect(prisma.keywordRule.create).toHaveBeenCalledWith({
      data: dto,
    });
  });

  it('updates monitored chat active state', async () => {
    const updatedChat = {
      id: 'chat-1',
      identifier: '@example',
      active: false,
    };

    prisma.monitoredChat.update.mockResolvedValue(updatedChat);

    await expect(
      service.updateChatActive('chat-1', { active: false }),
    ).resolves.toEqual(updatedChat);

    expect(prisma.monitoredChat.update).toHaveBeenCalledWith({
      where: { id: 'chat-1' },
      data: { active: false },
    });
  });

  it('updates keyword rule active state', async () => {
    const updatedRule = {
      id: 'rule-1',
      phrase: 'нужен сайт',
      type: 'INCLUDE',
      active: false,
    };

    prisma.keywordRule.update.mockResolvedValue(updatedRule);

    await expect(
      service.updateKeywordRuleActive('rule-1', { active: false }),
    ).resolves.toEqual(updatedRule);

    expect(prisma.keywordRule.update).toHaveBeenCalledWith({
      where: { id: 'rule-1' },
      data: { active: false },
    });
  });

  it('updates a monitored chat', async () => {
    const dto = {
      identifier: '@updated_example',
      title: 'Updated chat',
    };
    const updatedChat = {
      id: 'chat-1',
      ...dto,
      active: true,
    };

    prisma.monitoredChat.update.mockResolvedValue(updatedChat);

    await expect(service.updateChat('chat-1', dto)).resolves.toEqual(
      updatedChat,
    );

    expect(prisma.monitoredChat.update).toHaveBeenCalledWith({
      where: { id: 'chat-1' },
      data: dto,
    });
  });

  it('updates a keyword rule', async () => {
    const dto = {
      phrase: 'ищу разработчика',
      type: 'EXCLUDE' as const,
    };
    const updatedRule = {
      id: 'rule-1',
      ...dto,
      active: true,
    };

    prisma.keywordRule.update.mockResolvedValue(updatedRule);

    await expect(service.updateKeywordRule('rule-1', dto)).resolves.toEqual(
      updatedRule,
    );

    expect(prisma.keywordRule.update).toHaveBeenCalledWith({
      where: { id: 'rule-1' },
      data: dto,
    });
  });

  it('deletes a monitored chat', async () => {
    const deletedChat = {
      id: 'chat-1',
      identifier: '@example',
      active: false,
    };

    prisma.monitoredChat.delete.mockResolvedValue(deletedChat);

    await expect(service.deleteChat('chat-1')).resolves.toEqual(deletedChat);

    expect(prisma.monitoredChat.delete).toHaveBeenCalledWith({
      where: { id: 'chat-1' },
    });
  });

  it('deletes a keyword rule', async () => {
    const deletedRule = {
      id: 'rule-1',
      phrase: 'нужен сайт',
      type: 'INCLUDE',
      active: false,
    };

    prisma.keywordRule.delete.mockResolvedValue(deletedRule);

    await expect(service.deleteKeywordRule('rule-1')).resolves.toEqual(
      deletedRule,
    );

    expect(prisma.keywordRule.delete).toHaveBeenCalledWith({
      where: { id: 'rule-1' },
    });
  });

  it('returns conflict when a monitored chat already exists', async () => {
    prisma.monitoredChat.create.mockRejectedValue(createPrismaError('P2002'));

    await expect(
      service.createChat({
        identifier: '@example',
        title: 'Example chat',
        active: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns conflict when a keyword rule already exists', async () => {
    prisma.keywordRule.create.mockRejectedValue(createPrismaError('P2002'));

    await expect(
      service.createKeywordRule({
        phrase: 'нужен сайт',
        type: 'INCLUDE',
        active: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found when a monitored chat does not exist', async () => {
    prisma.monitoredChat.update.mockRejectedValue(createPrismaError('P2025'));

    await expect(
      service.updateChatActive('missing-chat', { active: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns not found when a keyword rule does not exist', async () => {
    prisma.keywordRule.delete.mockRejectedValue(createPrismaError('P2025'));

    await expect(
      service.deleteKeywordRule('missing-rule'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
