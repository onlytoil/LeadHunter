import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Query,
} from '@nestjs/common';

import { GetLeadsQueryDto } from './dto/get-leads-query.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { LeadsService } from './leads.service';
import { UpdateLeadNoteDto } from './dto/update-lead-note.dto';
import { UpdateLeadFollowUpDto } from './dto/update-lead-follow-up.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="leadhunter-leads.csv"')
  export(@Query() query: GetLeadsQueryDto) {
    return this.leadsService.export(query);
  }

  @Get()
  getAll(@Query() query: GetLeadsQueryDto) {
    return this.leadsService.getAll(query);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.leadsService.updateStatus(id, dto);
  }

  @Patch(':id/note')
  updateNote(@Param('id') id: string, @Body() dto: UpdateLeadNoteDto) {
    return this.leadsService.updateNote(id, dto);
  }

  @Patch(':id/follow-up')
  updateFollowUp(@Param('id') id: string, @Body() dto: UpdateLeadFollowUpDto) {
    return this.leadsService.updateFollowUp(id, dto);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.leadsService.complete(id);
  }
}
