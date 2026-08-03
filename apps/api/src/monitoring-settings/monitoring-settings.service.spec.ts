import { PrismaService } from '../prisma/prisma.service';
import { MonitoringSettingsService } from './monitoring-settings.service';

describe('MonitoringSettingsService', () => {
  const prisma = {
    monitoredChat: {
      findMany: jest.fn(),
    },
    keywordRule: {
      findMany: jest.fn(),
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
});
