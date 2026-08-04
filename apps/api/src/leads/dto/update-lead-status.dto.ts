import { IsEnum } from 'class-validator';
import { LeadStatus } from '../../generated/prisma/client';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status!: LeadStatus;
}
