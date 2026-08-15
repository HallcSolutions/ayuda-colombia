import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PublicNewsStatus } from '../../common/constants/app.constants';
import { CreatePublicNewsDto } from './create-public-news.dto';

export class UpdatePublicNewsDto extends PartialType(CreatePublicNewsDto) {
  @IsEnum(PublicNewsStatus)
  @IsOptional()
  status?: PublicNewsStatus;
}
