import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MissingStatus,
  MissingSubjectKind,
} from '../../common/constants/app.constants';

/**
 * Aviso contrastado por el equipo editorial. A diferencia del formulario ciudadano,
 * conserva solo el canal institucional y enlaza el original sin copiar sus fotos.
 */
export class CreateVerifiedMissingRecordDto {
  @IsEnum(MissingSubjectKind)
  kind!: MissingSubjectKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  ageYears?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  description!: string;

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
  lastSeenPlace!: string;

  @IsDateString()
  lastSeenAt!: string;

  @Type(() => Number)
  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  contactName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  contactPhone!: string;

  @IsEnum(MissingStatus)
  status!: MissingStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  sourceName!: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  sourceUrl!: string;

  /** Imagen alojada por la misma entidad: se enlaza, nunca se copia al volumen. */
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  @IsOptional()
  photoUrl?: string;

  @IsDateString()
  sourceVerifiedAt!: string;
}
