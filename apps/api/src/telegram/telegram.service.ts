import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Api } from 'teleproto';
import { NewMessage, NewMessageEvent } from 'teleproto/events';

import { PrismaService } from '../prisma/prisma.service';
import { ClientService } from './client.service';
import { NotificationService } from './notification.service';
import { ParserService } from './parser.service';

type MonitoredChat = {
  id: string;
  identifier: string;
};

type TelegramStatus = {
  enabled: boolean;
  listening: boolean;
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempt: number;
  lastError: string | null;
  lastErrorAt: Date | null;
  lastProcessedMessageAt: Date | null;
};

@Injectable()
export class TelegramService implements OnModuleInit, OnApplicationShutdown {
  private static readonly RECONNECT_BASE_DELAY_MS = 5_000;
  private static readonly RECONNECT_MAX_DELAY_MS = 60_000;

  private readonly logger = new Logger(TelegramService.name);
  private readonly enabled: boolean;

  private listening = false;
  private reconnecting = false;
  private reconnectAttempt = 0;
  private lastError: string | null = null;
  private lastErrorAt: Date | null = null;
  private lastProcessedMessageAt: Date | null = null;

  private isShuttingDown = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionCheckTimer: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<void> | null = null;
  private messageEvent?: NewMessage;

  private readonly messageHandler = (event: NewMessageEvent) => {
    void this.handleNewMessage(event).catch((error: unknown) => {
      this.logger.error(
        'Failed to process a Telegram message',
        this.getErrorMessage(error),
      );
    });
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    private readonly parserService: ParserService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {
    this.enabled = this.configService.get('TELEGRAM_ENABLED', false);
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('Telegram monitoring is disabled');
      return;
    }

    await this.refreshMonitoredChats();
    this.startConnectionCheck();
  }

  onApplicationShutdown(): void {
    this.isShuttingDown = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connectionCheckTimer) {
      clearInterval(this.connectionCheckTimer);
      this.connectionCheckTimer = null;
    }

    this.removeMessageHandler();
    this.listening = false;
    this.reconnecting = false;

    this.logger.log('Telegram monitoring stopped');
  }

  async refreshMonitoredChats(): Promise<void> {
    if (!this.enabled || this.isShuttingDown) {
      return;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshMonitoredChatsInternal().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  async validateChat(identifier: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await this.clientService.connect();
      await this.clientService.getClient().getEntity(identifier);
    } catch {
      throw new ServiceUnavailableException(
        `Не удалось найти Telegram-чат "${identifier}". Проверь username, ссылку или ID.`,
      );
    }
  }

  getStatus(): TelegramStatus {
    return {
      enabled: this.enabled,
      listening: this.listening,
      connected: this.clientService.isConnected(),
      reconnecting: this.reconnecting,
      reconnectAttempt: this.reconnectAttempt,
      lastError: this.lastError,
      lastErrorAt: this.lastErrorAt,
      lastProcessedMessageAt: this.lastProcessedMessageAt,
    };
  }

  private async refreshMonitoredChatsInternal(): Promise<void> {
    try {
      const monitoredChats = await this.prisma.monitoredChat.findMany({
        where: { active: true },
        select: { id: true, identifier: true },
        orderBy: { createdAt: 'asc' },
      });

      if (monitoredChats.length === 0) {
        this.removeMessageHandler();
        this.listening = false;
        this.reconnecting = false;
        this.reconnectAttempt = 0;
        this.lastError = null;
        this.lastErrorAt = null;

        this.logger.warn('No active Telegram chats configured');
        return;
      }

      await this.clientService.connect();

      const client = this.clientService.getClient();
      const chats = monitoredChats.map((chat) => chat.identifier);
      const nextMessageEvent = new NewMessage({
        chats,
        incoming: true,
      });

      this.removeMessageHandler();
      await this.restoreMissedMessages(monitoredChats);

      client.addEventHandler(this.messageHandler, nextMessageEvent);
      this.messageEvent = nextMessageEvent;

      this.listening = true;
      this.reconnecting = false;
      this.reconnectAttempt = 0;
      this.lastError = null;
      this.lastErrorAt = null;

      this.logger.log(`Monitoring ${chats.length} Telegram chat(s)`);
    } catch (error) {
      this.listening = false;
      this.lastError = this.getErrorMessage(error);
      this.lastErrorAt = new Date();

      this.logger.error(
        'Telegram monitoring is temporarily unavailable. The API will remain running.',
        this.lastError,
      );

      this.scheduleReconnect();
    }
  }

  private startConnectionCheck(): void {
    this.connectionCheckTimer = setInterval(() => {
      if (
        this.enabled &&
        !this.isShuttingDown &&
        this.listening &&
        !this.clientService.isConnected()
      ) {
        this.lastError = 'Telegram connection was lost';
        this.lastErrorAt = new Date();
        this.listening = false;

        this.logger.warn(
          'Telegram connection was lost. Reconnect will be attempted.',
        );

        this.scheduleReconnect();
      }
    }, 10_000);
  }

  private scheduleReconnect(): void {
    if (
      !this.enabled ||
      this.isShuttingDown ||
      this.reconnectTimer ||
      this.reconnecting
    ) {
      return;
    }

    this.reconnecting = true;
    this.reconnectAttempt += 1;

    const delay = Math.min(
      TelegramService.RECONNECT_BASE_DELAY_MS *
        2 ** (this.reconnectAttempt - 1),
      TelegramService.RECONNECT_MAX_DELAY_MS,
    );

    this.logger.warn(
      `Telegram reconnect attempt ${this.reconnectAttempt} is scheduled in ${
        delay / 1000
      } seconds`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnecting = false;

      void this.refreshMonitoredChats();
    }, delay);
  }

  private removeMessageHandler(): void {
    if (!this.messageEvent || !this.clientService.isConnected()) {
      this.messageEvent = undefined;
      return;
    }

    this.clientService
      .getClient()
      .removeEventHandler(this.messageHandler, this.messageEvent);

    this.messageEvent = undefined;
  }

  private async restoreMissedMessages(
    monitoredChats: MonitoredChat[],
  ): Promise<void> {
    const client = this.clientService.getClient();

    for (const monitoredChat of monitoredChats) {
      const checkpoint =
        await this.prisma.telegramMonitoringCheckpoint.findUnique({
          where: { chatId: monitoredChat.id },
        });

      if (!checkpoint) {
        continue;
      }

      try {
        const entity = await client.getEntity(monitoredChat.identifier);
        const messages = await client.getMessages(entity, {
          limit: 100,
          minId: checkpoint.lastMessageId,
        });

        const missedMessages = messages
          .filter(
            (message) =>
              message.id > checkpoint.lastMessageId && message.message?.trim(),
          )
          .sort((first, second) => first.id - second.id);

        for (const message of missedMessages) {
          await this.processMessage(message);
        }

        if (missedMessages.length > 0) {
          this.logger.log(
            `Recovered ${missedMessages.length} Telegram message(s) from ${monitoredChat.identifier}`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Could not recover messages from ${monitoredChat.identifier}: ${this.getErrorMessage(error)}`,
        );
      }
    }
  }

  private async handleNewMessage(event: NewMessageEvent): Promise<void> {
    await this.processMessage(event.message);
  }

  private async processMessage(message: Api.Message): Promise<void> {
    const text = message.text?.trim();
    const chatId = message.chatId;

    if (!text || !chatId) {
      return;
    }

    const [chat, sender] = await Promise.all([
      message.getChat(),
      message.getSender(),
    ]);

    const telegramChatId = chatId.toString();
    const chatInfo = this.getChatInfo(chat, telegramChatId);
    const senderInfo = this.getSenderInfo(sender);
    const match = await this.parserService.analyze(text);
    const link = this.buildMessageLink(
      chatInfo.username,
      telegramChatId,
      message.id,
    );
    const publishedAt = new Date(message.date * 1000);

    const storedMessage = await this.prisma.$transaction(async (tx) => {
      const channel = await tx.channel.upsert({
        where: { telegramId: BigInt(telegramChatId) },
        update: {
          title: chatInfo.title,
          username: chatInfo.username,
          active: true,
        },
        create: {
          telegramId: BigInt(telegramChatId),
          title: chatInfo.title,
          username: chatInfo.username,
        },
      });

      const stored = await tx.message.upsert({
        where: {
          telegramMessageId_channelId: {
            telegramMessageId: message.id,
            channelId: channel.id,
          },
        },
        update: {},
        create: {
          telegramMessageId: message.id,
          text,
          link,
          senderId: message.senderId
            ? BigInt(message.senderId.toString())
            : null,
          senderUsername: senderInfo.username,
          publishedAt,
          channelId: channel.id,
        },
        include: { lead: true, channel: true },
      });

      const monitoredChat = await tx.monitoredChat.findFirst({
        where: {
          active: true,
          OR: [
            { identifier: telegramChatId },
            ...(chatInfo.username
              ? [{ identifier: `@${chatInfo.username}` }]
              : []),
            ...(chatInfo.username ? [{ identifier: chatInfo.username }] : []),
          ],
        },
        select: { id: true },
      });

      if (monitoredChat) {
        await tx.telegramMonitoringCheckpoint.upsert({
          where: { chatId: monitoredChat.id },
          update: {
            telegramChatId: BigInt(telegramChatId),
            lastMessageId: message.id,
            lastMessageAt: publishedAt,
          },
          create: {
            chatId: monitoredChat.id,
            telegramChatId: BigInt(telegramChatId),
            lastMessageId: message.id,
            lastMessageAt: publishedAt,
          },
        });
      }

      return stored;
    });

    this.lastProcessedMessageAt = new Date();

    if (!match.isLead || storedMessage.lead) {
      return;
    }

    const lead = await this.prisma.lead.create({
      data: {
        messageId: storedMessage.id,
        matchedKeywords: match.matchedKeywords,
      },
    });

    try {
      await this.notificationService.sendLead({
        channelTitle: storedMessage.channel.title,
        senderUsername: storedMessage.senderUsername,
        text: storedMessage.text,
        link: storedMessage.link,
        matchedKeywords: match.matchedKeywords,
      });

      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { notifiedAt: new Date(), notificationError: null },
      });
    } catch (error) {
      const notificationError = this.getErrorMessage(error);

      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { notificationError },
      });

      this.logger.error(`Lead ${lead.id} was saved but not notified`, error);
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private getChatInfo(
    chat: Api.TypeUser | Api.TypeChat | undefined,
    fallbackId: string,
  ): { title: string; username: string | null } {
    if (!chat) {
      return { title: fallbackId, username: null };
    }

    const username = 'username' in chat ? (chat.username ?? null) : null;

    if ('title' in chat) {
      return { title: chat.title, username };
    }

    const name =
      'firstName' in chat
        ? [chat.firstName, chat.lastName].filter(Boolean).join(' ')
        : '';

    return { title: name || username || fallbackId, username };
  }

  private getSenderInfo(sender: Api.TypeUser | Api.TypeChat | undefined): {
    username: string | null;
  } {
    return {
      username:
        sender && 'username' in sender ? (sender.username ?? null) : null,
    };
  }

  private buildMessageLink(
    username: string | null,
    chatId: string,
    messageId: number,
  ): string | null {
    if (username) {
      return `https://t.me/${username}/${messageId}`;
    }

    if (chatId.startsWith('-100')) {
      return `https://t.me/c/${chatId.slice(4)}/${messageId}`;
    }

    return null;
  }
}
