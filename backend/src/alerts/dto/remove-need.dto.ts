import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RemoveNeedDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  need!: string;
}
