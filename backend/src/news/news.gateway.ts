import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PublicNewsItem } from '../common/interfaces/public-news.interface';

@WebSocketGateway({ namespace: '/news', cors: true })
export class NewsGateway {
  @WebSocketServer() private readonly server!: Server;

  created(item: PublicNewsItem): void {
    this.server.emit('news.created', item);
  }

  updated(item: PublicNewsItem): void {
    this.server.emit('news.updated', item);
  }
}
