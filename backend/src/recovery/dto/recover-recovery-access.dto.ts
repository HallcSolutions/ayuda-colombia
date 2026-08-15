import { IsEmail, MaxLength } from 'class-validator';

export class RecoverRecoveryAccessDto {
  @IsEmail() @MaxLength(160) email!: string;
}
