import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { ClientService } from './client.service';
import { ParserService } from './parser.service';
import { NotificationService } from './notification.service';
import { FollowUpReminderService } from './follow-up-reminder.service';

@Module({
  controllers: [TelegramController],
  providers: [
    TelegramService,
    ClientService,
    ParserService,
    NotificationService,
    FollowUpReminderService,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
