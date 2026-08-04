import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

@Injectable()
export class FollowUpReminderService {
  private readonly logger = new Logger(FollowUpReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 0 9 * * *', {
    timeZone: 'Asia/Yekaterinburg',
  })
  async sendDailyReminder(): Promise<void> {
    const { start, end } = this.getTodayRange();

    const overdueWhere = {
      followUpAt: {
        lt: start,
      },
    };

    const todayWhere = {
      followUpAt: {
        gte: start,
        lte: end,
      },
    };

    const include = {
      message: {
        include: {
          channel: true,
        },
      },
    } as const;

    const [overdue, overdueTotal, today, todayTotal] = await Promise.all([
      this.prisma.lead.findMany({
        where: overdueWhere,
        include,
        orderBy: [{ followUpAt: 'asc' }, { createdAt: 'desc' }],
        take: 8,
      }),
      this.prisma.lead.count({ where: overdueWhere }),
      this.prisma.lead.findMany({
        where: todayWhere,
        include,
        orderBy: [{ followUpAt: 'asc' }, { createdAt: 'desc' }],
        take: 8,
      }),
      this.prisma.lead.count({ where: todayWhere }),
    ]);

    if (overdueTotal === 0 && todayTotal === 0) {
      this.logger.log('No overdue or today follow-up leads');
      return;
    }

    try {
      await this.notificationService.sendFollowUpReminder({
        overdue: overdue.map((lead) => ({
          channelTitle: lead.message.channel.title,
          senderUsername: lead.message.senderUsername,
          followUpAt: lead.followUpAt!,
          link: lead.message.link,
        })),
        overdueTotal,
        today: today.map((lead) => ({
          channelTitle: lead.message.channel.title,
          senderUsername: lead.message.senderUsername,
          followUpAt: lead.followUpAt!,
          link: lead.message.link,
        })),
        todayTotal,
      });

      this.logger.log(
        `Sent follow-up reminder: ${overdueTotal} overdue, ${todayTotal} today`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send follow-up reminder',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private getTodayRange(date = new Date()) {
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

    const start = new Date(
      Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
      ) -
        5 * 60 * 60 * 1000,
    );

    return {
      start,
      end: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1),
    };
  }
}
