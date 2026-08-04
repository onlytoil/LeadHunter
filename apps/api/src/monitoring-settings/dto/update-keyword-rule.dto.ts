import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateKeywordRuleDto {
  @Transform(({ value }) => {
    const input: unknown = value;

    return typeof input === 'string' ? input.trim() || undefined : input;
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  phrase?: string;

  @IsOptional()
  @IsIn(['INCLUDE', 'EXCLUDE'])
  type?: 'INCLUDE' | 'EXCLUDE';
}
