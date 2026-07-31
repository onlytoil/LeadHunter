import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { ClientService } from './client.service';
import { AuthService } from './auth.service';
import { ParserService } from './parser.service';

@Module({
  controllers: [TelegramController],
  providers: [
    TelegramService,
    ClientService,
    AuthService,
    ParserService,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}