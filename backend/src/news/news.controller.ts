import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PublicNewsItem } from '../common/interfaces/public-news.interface';
import { CreatePublicNewsDto } from './dto/create-public-news.dto';
import { FindPublicNewsQueryDto } from './dto/find-public-news-query.dto';
import { UpdatePublicNewsDto } from './dto/update-public-news.dto';
import { NewsPublisherGuard } from './news-publisher.guard';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  findAll(@Query() filters: FindPublicNewsQueryDto): Promise<PublicNewsItem[]> {
    return this.newsService.findAll(filters);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<PublicNewsItem> {
    return this.newsService.findOne(id);
  }

  @Post()
  @UseGuards(NewsPublisherGuard)
  create(@Body() dto: CreatePublicNewsDto): Promise<PublicNewsItem> {
    return this.newsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(NewsPublisherGuard)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdatePublicNewsDto,
  ): Promise<PublicNewsItem> {
    return this.newsService.update(id, dto);
  }
}
