import { Module } from '@nestjs/common';

import { MonitoringSettingsController } from './monitoring-settings.controller';
import { MonitoringSettingsService } from './monitoring-settings.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [MonitoringSettingsController],
  providers: [MonitoringSettingsService],
  exports: [MonitoringSettingsService],
})
export class MonitoringSettingsModule {}
