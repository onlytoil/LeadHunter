import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LeadNotification {
  channelTitle: string;
  senderUsername?: string | null;
  text: string;
  link?: string | null;
  matchedKeywords: string[];
}

@Injectable()
export class NotificationService {
  constructor(private readonly configService: ConfigService) {}

  async sendLead(notification: LeadNotification): Promise<void> {
    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.getOrThrow<string>(
      'TELEGRAM_NOTIFICATION_CHAT_ID',
    );
    const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        text: this.formatMessage(notification),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram Bot API returned ${response.status}: ${body}`);
    }
  }

  private formatMessage(notification: LeadNotification): string {
    const sender = notification.senderUsername
      ? `@${this.escapeHtml(notification.senderUsername)}`
      : 'неизвестен / unknown';
    const keywords = notification.matchedKeywords
      .map((keyword) => this.escapeHtml(keyword))
      .join(', ');
    const link = notification.link
      ? `\n<a href="${this.escapeHtml(notification.link)}">Открыть сообщение / Open message</a>`
      : '';

    return [
      '<b>Новый лид / New lead</b>',
      `<b>Чат:</b> ${this.escapeHtml(notification.channelTitle)}`,
      `<b>Автор:</b> ${sender}`,
      `<b>Совпадения:</b> ${keywords}`,
      '',
      this.escapeHtml(notification.text.slice(0, 2500)),
      link,
    ].join('\n');
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }
}
