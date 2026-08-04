import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateKeywordRuleDto {
  @Transform(({ value }) => {
    const input: unknown = value;
    return typeof input === 'string' ? input.trim() : input;
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  phrase!: string;

  @IsIn(['INCLUDE', 'EXCLUDE'])
  type!: 'INCLUDE' | 'EXCLUDE';

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
