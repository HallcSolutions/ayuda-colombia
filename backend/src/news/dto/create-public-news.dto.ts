import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { PublicNewsCategory } from '../../common/constants/app.constants';

export class CreatePublicNewsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(700)
  summary!: string;

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(240, { each: true })
  steps!: string[];

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  requirements!: string[];

  @IsEnum(PublicNewsCategory)
  category!: PublicNewsCategory;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  department?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  municipality?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  sourceName!: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  sourceUrl!: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  contactInfo?: string;

  @Type(() => Date)
  @IsDate()
  publishedAt!: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  validUntil?: Date;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}
