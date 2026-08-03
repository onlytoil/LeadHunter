import { Controller, Get } from '@nestjs/common';

import { MonitoringSettingsService } from './monitoring-settings.service';

@Controller('monitoring-settings')
export class MonitoringSettingsController {
  constructor(
    private readonly monitoringSettingsService: MonitoringSettingsService,
  ) {}

  @Get()
  getAll() {
    return this.monitoringSettingsService.getAll();
  }
}