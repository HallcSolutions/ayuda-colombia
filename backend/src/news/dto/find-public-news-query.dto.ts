import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PublicNewsCategory } from '../../common/constants/app.constants';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class FindPublicNewsQueryDto {
  @IsEnum(PublicNewsCategory)
  @IsOptional()
  category?: PublicNewsCategory;

  @Transform(trim)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  department?: string;

  @Transform(trim)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  municipality?: string;
}
