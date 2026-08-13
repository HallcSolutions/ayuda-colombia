import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { SupplyCategory } from '../../common/constants/app.constants';

export class CreateConvoyTripDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  driverName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  contactPhone!: string;

  @IsString()
  @MaxLength(12)
  @IsOptional()
  vehiclePlate?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  vehicleDescription!: string;

  @IsEnum(SupplyCategory, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(Object.keys(SupplyCategory).length)
  cargo!: SupplyCategory[];

  @IsString()
  @MaxLength(300)
  @IsOptional()
  cargoNotes?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  originDepartment!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  originMunicipality!: string;

  @IsUUID()
  destinationPointId!: string;

  @IsDateString()
  departureAt!: string;

  /** Rastrear el camión es decisión de quien conduce: aquí la marca o no la marca. */
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  shareLocation!: boolean;
}
