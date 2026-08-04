import { IsDateString, IsOptional } from 'class-validator';

export class UpdateLeadFollowUpDto {
  @IsOptional()
  @IsDateString()
  followUpAt?: string | null;
}
