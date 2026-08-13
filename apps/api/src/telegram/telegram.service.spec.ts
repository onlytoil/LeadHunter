import { ConfigService } from '@nestjs/config';
import { NewMessage } from 'teleproto/events';

import { PrismaService } from '../prisma/prisma.service';
import { ClientService } from './client.service';
import { NotificationService } from './notification.service';
import { ParserService } from './parser.service';
import { TelegramService } from './telegram.service';

jest.mock('teleproto/events', () => ({
  NewMessage: jest.fn().mockImplementation((options: unknown) => options),
}));

describe('TelegramService', () => {
  const configService = {
    get: jest.fn(),
  };

  const client = {
    addEventHandler: jest.fn(),
    removeEventHandler: jest.fn(),
    getEntity: jest.fn(),
    getMessages: jest.fn(),
  };

  const clientService = {
    getClient: jest.fn(() => client),
    connect: jest.fn(),
    isConnected: jest.fn().mockReturnValue(false),
  };

  const prisma = {
    monitoredChat: {
      findMany: jest.fn(),
    },
    telegramMonitoringCheckpoint: {
      findUnique: jest.fn(),
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

    clientService.isConnected.mockReturnValue(false);
    prisma.telegramMonitoringCheckpoint.findUnique.mockResolvedValue(null);
  });

  it('loads active monitored chats from the database', async () => {
    prisma.monitoredChat.findMany.mockResolvedValue([
      { id: 'chat-1', identifier: '@first_chat' },
      { id: 'chat-2', identifier: '-1001234567890' },
    ]);

    const service = createService();

    await service.onModuleInit();

    expect(prisma.monitoredChat.findMany).toHaveBeenCalledWith({
      where: { active: true },
      select: { id: true, identifier: true },
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
      connected: false,
      reconnecting: false,
      reconnectAttempt: 0,
      lastError: null,
      lastErrorAt: null,
      lastProcessedMessageAt: null,
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
      connected: false,
      reconnecting: false,
      reconnectAttempt: 0,
      lastError: null,
      lastErrorAt: null,
      lastProcessedMessageAt: null,
    });
  });

  it('does not load chats when Telegram monitoring is disabled', async () => {
    const service = createService(false);

    await service.onModuleInit();

    expect(prisma.monitoredChat.findMany).not.toHaveBeenCalled();
    expect(clientService.connect).not.toHaveBeenCalled();
  });

  it('checks that a Telegram chat exists before it is added', async () => {
    client.getEntity.mockResolvedValue({});

    const service = createService();

    await expect(service.validateChat('@first_chat')).resolves.toBeUndefined();

    expect(clientService.connect).toHaveBeenCalledTimes(1);
    expect(client.getEntity).toHaveBeenCalledWith('@first_chat');
  });

  it('stops listening during application shutdown', async () => {
    prisma.monitoredChat.findMany.mockResolvedValue([
      { id: 'chat-1', identifier: '@first_chat' },
    ]);
    clientService.isConnected.mockReturnValue(true);

    const service = createService();

    await service.onModuleInit();
    service.onApplicationShutdown();

    expect(client.removeEventHandler).toHaveBeenCalledTimes(1);
    expect(service.getStatus().listening).toBe(false);
  });
});
