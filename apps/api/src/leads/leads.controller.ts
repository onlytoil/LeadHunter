import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';

import { GetLeadsQueryDto } from './dto/get-leads-query.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  getAll(@Query() query: GetLeadsQueryDto) {
    return this.leadsService.getAll(query);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.leadsService.updateStatus(id, dto);
  }
}
