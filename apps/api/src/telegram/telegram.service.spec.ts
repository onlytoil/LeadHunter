import { ConfigService } from '@nestjs/config';
import { NewMessage } from 'telegram/events';

import { PrismaService } from '../prisma/prisma.service';
import { ClientService } from './client.service';
import { NotificationService } from './notification.service';
import { ParserService } from './parser.service';
import { TelegramService } from './telegram.service';

jest.mock('telegram/events', () => ({
  NewMessage: jest.fn().mockImplementation((options) => options),
}));

describe('TelegramService', () => {
  const configService = {
    get: jest.fn(),
  };

  const client = {
    addEventHandler: jest.fn(),
  };

  const clientService = {
    getClient: jest.fn(() => client),
    connect: jest.fn(),
  };

  const prisma = {
    monitoredChat: {
      findMany: jest.fn(),
    },
  };

  const createService = (enabled = true) => {
    configService.get.mockReturnValue(enabled);

    return new TelegramService(
      configService as unknown as ConfigService,
      clientService as unknown as ClientService,
      {} as ParserService,
      {} as NotificationService,
      prisma as unknown as PrismaService,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads active monitored chats from the database', async () => {
    prisma.monitoredChat.findMany.mockResolvedValue([
      { identifier: '@first_chat' },
      { identifier: '-1001234567890' },
    ]);

    const service = createService();

    await service.onModuleInit();

    expect(prisma.monitoredChat.findMany).toHaveBeenCalledWith({
      where: { active: true },
      select: { identifier: true },
      orderBy: { createdAt: 'asc' },
    });
    expect(clientService.connect).toHaveBeenCalledTimes(1);
    expect(NewMessage).toHaveBeenCalledWith({
      chats: ['@first_chat', '-1001234567890'],
      incoming: true,
    });
    expect(client.addEventHandler).toHaveBeenCalledTimes(1);
    expect(service.getStatus()).toEqual({
      enabled: true,
      listening: true,
    });
  });

  it('does not connect when there are no active chats', async () => {
    prisma.monitoredChat.findMany.mockResolvedValue([]);

    const service = createService();

    await service.onModuleInit();

    expect(clientService.connect).not.toHaveBeenCalled();
    expect(client.addEventHandler).not.toHaveBeenCalled();
    expect(service.getStatus()).toEqual({
      enabled: true,
      listening: false,
    });
  });

  it('does not load chats when Telegram monitoring is disabled', async () => {
    const service = createService(false);

    await service.onModuleInit();

    expect(prisma.monitoredChat.findMany).not.toHaveBeenCalled();
    expect(clientService.connect).not.toHaveBeenCalled();
  });
});