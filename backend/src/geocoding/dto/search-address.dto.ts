import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SearchAddressDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(180)
  query!: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  department?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  municipality?: string;
}
