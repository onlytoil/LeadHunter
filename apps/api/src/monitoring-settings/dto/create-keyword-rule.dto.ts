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
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
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