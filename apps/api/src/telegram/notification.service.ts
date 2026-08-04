import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LeadNotification {
  channelTitle: string;
  senderUsername?: string | null;
  text: string;
  link?: string | null;
  matchedKeywords: string[];
}

export interface FollowUpReminderLead {
  channelTitle: string;
  senderUsername?: string | null;
  followUpAt: Date;
  link?: string | null;
}

export interface FollowUpReminder {
  overdue: FollowUpReminderLead[];
  overdueTotal: number;
  today: FollowUpReminderLead[];
  todayTotal: number;
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

  async sendFollowUpReminder(reminder: FollowUpReminder): Promise<void> {
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
        text: this.formatFollowUpReminder(reminder),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram Bot API returned ${response.status}: ${body}`);
    }
  }

  private formatFollowUpReminder(reminder: FollowUpReminder): string {
    return [
      '<b>Напоминание по лидам / Lead follow-up reminder</b>',
      `<b>Просрочено:</b> ${reminder.overdueTotal}`,
      `<b>Сегодня:</b> ${reminder.todayTotal}`,
      '',
      this.formatReminderSection(
        'Просроченные / Overdue',
        reminder.overdue,
        reminder.overdueTotal,
      ),
      '',
      this.formatReminderSection(
        'На сегодня / Today',
        reminder.today,
        reminder.todayTotal,
      ),
    ].join('\n');
  }

  private formatReminderSection(
    title: string,
    leads: FollowUpReminderLead[],
    total: number,
  ): string {
    if (total === 0) {
      return `<b>${title}</b>\nНет / None`;
    }

    const items = leads.map((lead) => {
      const chatTitle = this.escapeHtml(lead.channelTitle);
      const chat = lead.link
        ? `<a href="${this.escapeHtml(lead.link)}">${chatTitle}</a>`
        : chatTitle;
      const sender = lead.senderUsername
        ? `@${this.escapeHtml(lead.senderUsername)}`
        : 'неизвестен / unknown';
      const date = this.formatFollowUpDate(lead.followUpAt);

      return `• ${chat} — ${sender} — ${date}`;
    });

    const remaining = total - leads.length;
    const suffix = remaining > 0 ? `\n<i>И ещё: ${remaining}</i>` : '';

    return `<b>${title}</b>\n${items.join('\n')}${suffix}`;
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

  private formatFollowUpDate(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Yekaterinburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }
}
