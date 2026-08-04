import { IsString, MaxLength } from 'class-validator';

export class UpdateLeadNoteDto {
  @IsString()
  @MaxLength(2000)
  note!: string;
}
