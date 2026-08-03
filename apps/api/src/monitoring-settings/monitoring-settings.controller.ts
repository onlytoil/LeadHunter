import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateKeywordRuleDto } from './dto/create-keyword-rule.dto';
import { CreateMonitoredChatDto } from './dto/create-monitored-chat.dto';
import { MonitoringSettingsService } from './monitoring-settings.service';
import { UpdateActiveDto } from './dto/update-active.dto';

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

  @Patch('chats/:id/active')
  updateChatActive(@Param('id') id: string, @Body() dto: UpdateActiveDto) {
    return this.monitoringSettingsService.updateChatActive(id, dto);
  }

  @Patch('keyword-rules/:id/active')
  updateKeywordRuleActive(
    @Param('id') id: string,
    @Body() dto: UpdateActiveDto,
  ) {
    return this.monitoringSettingsService.updateKeywordRuleActive(id, dto);
  }

  @Delete('chats/:id')
  deleteChat(@Param('id') id: string) {
    return this.monitoringSettingsService.deleteChat(id);
  }

  @Delete('keyword-rules/:id')
  deleteKeywordRule(@Param('id') id: string) {
    return this.monitoringSettingsService.deleteKeywordRule(id);
  }
}
