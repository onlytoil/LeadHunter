import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMonitoredChatDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim() || null;
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;
}