import { Type } from 'class-transformer';
import { IsInt, Max, Min, NotEquals } from 'class-validator';

/**
 * Movimiento de cupos: positivo cuando llega gente a dormir (merma la disponibilidad)
 * y negativo cuando se van y el cupo vuelve a quedar libre.
 */
export class UpdateOccupancyDto {
  @Type(() => Number)
  @IsInt()
  @Min(-2000)
  @Max(2000)
  @NotEquals(0)
  delta!: number;
}
