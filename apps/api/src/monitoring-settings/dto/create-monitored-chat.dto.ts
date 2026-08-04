import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMonitoredChatDto {
  @Transform(({ value }) => {
    const input: unknown = value;

    return typeof input === 'string' ? input.trim() : input;
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier!: string;

  @Transform(({ value }) => {
    const input: unknown = value;

    return typeof input === 'string' ? input.trim() || undefined : input;
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
