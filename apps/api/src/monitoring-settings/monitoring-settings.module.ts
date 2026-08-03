import { Module } from '@nestjs/common';

import { MonitoringSettingsController } from './monitoring-settings.controller';
import { MonitoringSettingsService } from './monitoring-settings.service';

@Module({
  controllers: [MonitoringSettingsController],
  providers: [MonitoringSettingsService],
  exports: [MonitoringSettingsService],
})
export class MonitoringSettingsModule {}