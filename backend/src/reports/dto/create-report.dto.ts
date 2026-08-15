import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateBy,
  ValidateIf,
} from 'class-validator';
import {
  HelpContactChannel,
  HelpContactRole,
  UrgencyLevel,
} from '../../common/constants/app.constants';
import { hasValidReportNeeds } from '../report-needs';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  reporterName!: string;

  /**
   * Se aceptan letras y guiones, no solo los dígitos de la cédula colombiana: en un
   * albergue hay cédulas de extranjería y pasaportes, y rechazarlos dejaría fuera de
   * la ayuda justo a quien menos respaldo tiene.
   */
  @IsString()
  @IsOptional()
  @Matches(/^[A-Za-z0-9-]{5,20}$/)
  documentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(/^[0-9+()\s-]{7,20}$/)
  contactPhone!: string;

  @IsEnum(HelpContactRole)
  contactRole!: HelpContactRole;

  @IsEnum(HelpContactChannel)
  contactChannel!: HelpContactChannel;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  consentToDirectContact!: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  department!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  municipality!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  addressReference!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  householdSize!: number;

  @IsEnum(UrgencyLevel)
  urgency!: UrgencyLevel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1200)
  @ValidateBy({
    name: 'hasValidReportNeeds',
    validator: {
      validate: hasValidReportNeeds,
      defaultMessage: () => 'Debes indicar entre 1 y 12 necesidades válidas',
    },
  })
  needs!: string;

  @IsString()
  @MaxLength(800)
  @IsOptional()
  notice?: string;

  @ValidateIf((dto: CreateReportDto) =>
    Boolean(dto.latitude !== undefined || dto.longitude !== undefined),
  )
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ValidateIf((dto: CreateReportDto) =>
    Boolean(dto.latitude !== undefined || dto.longitude !== undefined),
  )
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  accuracy?: number;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  consentToShareLocation?: boolean;
}
