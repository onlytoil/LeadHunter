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
});
