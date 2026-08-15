import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicNewsEntity } from './infrastructure/entities/public-news.entity';
import { NewsController } from './news.controller';
import { NewsGateway } from './news.gateway';
import { NewsPublisherGuard } from './news-publisher.guard';
import { NewsService } from './news.service';

@Module({
  imports: [TypeOrmModule.forFeature([PublicNewsEntity])],
  controllers: [NewsController],
  providers: [NewsGateway, NewsPublisherGuard, NewsService],
})
export class NewsModule {}
