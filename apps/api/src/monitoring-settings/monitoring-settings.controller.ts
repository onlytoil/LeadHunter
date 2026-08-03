import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreateKeywordRuleDto } from './dto/create-keyword-rule.dto';
import { CreateMonitoredChatDto } from './dto/create-monitored-chat.dto';
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

  @Post('chats')
  createChat(@Body() dto: CreateMonitoredChatDto) {
    return this.monitoringSettingsService.createChat(dto);
  }

  @Post('keyword-rules')
  createKeywordRule(@Body() dto: CreateKeywordRuleDto) {
    return this.monitoringSettingsService.createKeywordRule(dto);
  }
}