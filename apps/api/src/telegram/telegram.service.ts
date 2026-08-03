import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Api } from 'telegram';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { PrismaService } from '../prisma/prisma.service';
import { ClientService } from './client.service';
import { NotificationService } from './notification.service';
import { ParserService } from './parser.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly enabled: boolean;
  private listening = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    private readonly parserService: ParserService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {
    this.enabled = this.configService.get<boolean>('TELEGRAM_ENABLED', false);
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('Telegram monitoring is disabled');
      return;
    }

    const monitoredChats = await this.prisma.monitoredChat.findMany({
      where: { active: true },
      select: { identifier: true },
      orderBy: { createdAt: 'asc' },
    });

    const chats = monitoredChats.map((chat) => chat.identifier);

    if (chats.length === 0) {
      this.logger.warn('No active Telegram chats configured');
      return;
    }

    const client = this.clientService.getClient();

    await this.clientService.connect();
    client.addEventHandler(
      (event: NewMessageEvent) => {
        void this.handleNewMessage(event).catch((error: unknown) => {
          this.logger.error('Failed to process a Telegram message', error);
        });
      },
      new NewMessage({ chats, incoming: true }),
    );

    this.listening = true;
    this.logger.log(`Monitoring ${chats.length} Telegram chat(s)`);
  }

  getStatus() {
    return {
      enabled: this.enabled,
      listening: this.listening,
    };
  }

  private async handleNewMessage(event: NewMessageEvent): Promise<void> {
    const message = event.message;
    const text = message.text?.trim();
    const chatId = message.chatId;

    if (!text || !chatId) {
      return;
    }

    const [chat, sender] = await Promise.all([
      message.getChat(),
      message.getSender(),
    ]);
    const chatInfo = this.getChatInfo(chat, chatId.toString());
    const senderInfo = this.getSenderInfo(sender);
    const match = await this.parserService.analyze(text);
    const link = this.buildMessageLink(
      chatInfo.username,
      chatId.toString(),
      message.id,
    );
    const publishedAt = new Date(message.date * 1000);

    const storedMessage = await this.prisma.$transaction(async (tx) => {
      const channel = await tx.channel.upsert({
        where: { telegramId: BigInt(chatId.toString()) },
        update: {
          title: chatInfo.title,
          username: chatInfo.username,
          active: true,
        },
        create: {
          telegramId: BigInt(chatId.toString()),
          title: chatInfo.title,
          username: chatInfo.username,
        },
      });

      return tx.message.upsert({
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
    });

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
      const notificationError =
        error instanceof Error ? error.message : String(error);
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { notificationError },
      });
      this.logger.error(`Lead ${lead.id} was saved but not notified`, error);
    }
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