import { IsEnum, IsOptional } from 'class-validator';
import { LeadStatus } from '../../generated/prisma/client';

export class GetLeadsQueryDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}
