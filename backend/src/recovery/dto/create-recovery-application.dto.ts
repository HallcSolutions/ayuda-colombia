import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRecoveryApplicationDto {
  @IsUUID() helperId!: string;
  @IsString() @MaxLength(500) message!: string;
  @IsString() @IsNotEmpty() @MaxLength(180) availability!: string;
}
