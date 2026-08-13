import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MissingRecord } from '../common/interfaces/missing-record.interface';

@WebSocketGateway({ namespace: '/missing', cors: { origin: '*' } })
export class MissingGateway {
  @WebSocketServer()
  server!: Server;

  recordCreated(record: MissingRecord): void {
    this.server.emit('missing.created', record);
  }

  recordUpdated(record: MissingRecord): void {
    this.server.emit('missing.updated', record);
  }
}
